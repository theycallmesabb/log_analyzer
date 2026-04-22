package com.securelog.ml;

import com.securelog.model.HttpLog;
import org.springframework.stereotype.Component;

import java.util.Random;

/**
 * Algorithm 3: Isolation Forest-Inspired Detector
 *
 * PRIMARY domain: general/unknown anomalies — traffic that deviates from
 * normal baseline without matching specific rules.
 * DELIBERATELY capped to prevent dominating over RuleBased/ZScore.
 *
 * Key design change: endpoint risk NO LONGER maps attack patterns to high scores.
 * That's RuleBased's job. IsolationForest only uses structural features:
 * latency normalization, status deviation, method rarity, path depth.
 */
@Component
public class IsolationForestDetector implements AnomalyDetector {

    private static final int  NUM_TREES = 20;
    private static final int  MAX_DEPTH = 10;
    private static final long SEED      = 42L;

    // Normal traffic centroid: low latency, 2xx status, GET, shallow path
    private static final double[] NORMAL_CENTER = {0.05, 0.00, 0.05, 0.15};

    // Hard cap: IsolationForest will never exceed this score.
    // Prevents it from overriding RuleBased on attack patterns.
    private static final double MAX_SCORE = 0.72;

    @Override public String getName() { return "IsolationForest"; }

    @Override
    public double score(HttpLog log) {
        double[] features = extractFeatures(log);
        double totalPath  = 0.0;

        for (int t = 0; t < NUM_TREES; t++) {
            totalPath += treePathLength(features, new Random(SEED + t));
        }

        double avgPath    = totalPath / NUM_TREES;
        double normalized = 1.0 - (avgPath / MAX_DEPTH);

        // Distance from normal center — structural deviation only
        double dist      = euclidean(features, NORMAL_CENTER);
        double distBoost = Math.min(dist / 2.5, 0.25); // max 0.25 boost (reduced)

        double raw = Math.max(normalized, 0) + distBoost;
        // Cap score — IsolationForest is a fallback, not a primary detector
        return Math.min(raw, MAX_SCORE);
    }

    private double treePathLength(double[] features, Random rnd) {
        int depth = 0;
        while (depth < MAX_DEPTH) {
            int    dim   = rnd.nextInt(features.length);
            double split = 0.10 + rnd.nextDouble() * 0.40;
            if (features[dim] <= split) depth++;
            else break;
        }
        return depth + 1;
    }

    private double[] extractFeatures(HttpLog log) {
        // Feature 0: normalized latency (structural timing deviation)
        double lat     = log.getLatencyMs() != null ? log.getLatencyMs() : 100.0;
        double normLat = Math.max(0, Math.min(1.0, (lat - 40.0) / 1960.0));

        // Feature 1: status deviation from 200 (0=normal, 1=very anomalous)
        // Simple bucketing — no overlap with RuleBased's specific rules
        double statusDev = mapStatusDeviation(log.getStatus());

        // Feature 2: method rarity (GET=rare=0, DELETE=common anomaly=high)
        double methodRarity = mapMethodRarity(log.getMethod());

        // Feature 3: path depth / complexity (deep paths = more suspicious structurally)
        double pathComplexity = mapPathComplexity(log.getEndpoint());

        return new double[]{normLat, statusDev, methodRarity, pathComplexity};
    }

    // Status deviation: how far from "normal 200" is this?
    private double mapStatusDeviation(Integer s) {
        if (s == null)                       return 0.40;
        if (s >= 200 && s < 300)             return 0.00;
        if (s == 301 || s == 302)            return 0.05;
        if (s == 404)                        return 0.30;
        if (s == 401 || s == 403)            return 0.50;
        if (s >= 400 && s < 500)             return 0.45;
        if (s >= 500)                        return 0.70;
        return 0.35;
    }

    // Method rarity in normal traffic
    private double mapMethodRarity(String m) {
        if (m == null) return 0.30;
        return switch (m.toUpperCase()) {
            case "GET"    -> 0.05;
            case "POST"   -> 0.15;
            case "PUT"    -> 0.35;
            case "PATCH"  -> 0.50;
            case "DELETE" -> 0.65;
            default       -> 0.55;
        };
    }

    // Path complexity: long/deep paths are structurally unusual
    private double mapPathComplexity(String ep) {
        if (ep == null) return 0.20;
        long slashes = ep.chars().filter(c -> c == '/').count();
        int  len     = ep.length();
        boolean hasQuery = ep.contains("?") || ep.contains("=");
        double score = 0.10;
        if (slashes > 4)  score += 0.15;
        if (slashes > 6)  score += 0.15;
        if (len > 100)    score += 0.15;
        if (len > 200)    score += 0.15;
        if (hasQuery)     score += 0.10;
        return Math.min(score, 0.70);
    }

    private double euclidean(double[] a, double[] b) {
        double sum = 0;
        for (int i = 0; i < a.length; i++) { double d = a[i] - b[i]; sum += d * d; }
        return Math.sqrt(sum);
    }

    @Override public double threshold() { return 0.40; }
}
