package com.securelog.ml;

import com.securelog.model.HttpLog;
import org.springframework.stereotype.Component;

/**
 * Algorithm 4: K-Means Clustering Detector
 *
 * PRIMARY domain: behavioral clustering — traffic that doesn't match
 * "known good" cluster profiles. Good at detecting unusual combinations
 * (e.g. DELETE + 200 + /api/data, or repeated GETs to varied sensitive paths).
 *
 * Cluster definitions:
 *   C0: Normal reads     — GET 2xx low-latency public paths
 *   C1: Normal writes    — POST/PUT 2xx medium-latency API
 *   C2: Auth anomalies   — 401/403 any method
 *   C3: Error traffic    — 5xx high-latency
 *   C4: Attack traffic   — high method-risk + high path-risk
 */
@Component
public class KMeansDetector implements AnomalyDetector {

    // [latencyNorm, statusScore, methodRisk, pathRisk]
    private static final double[][] CENTROIDS = {
        {0.05, 0.00, 0.05, 0.10},  // C0: normal reads
        {0.20, 0.02, 0.18, 0.22},  // C1: normal writes
        {0.25, 0.60, 0.15, 0.55},  // C2: auth anomalies
        {0.70, 0.80, 0.20, 0.30},  // C3: error/overload traffic
        {0.35, 0.40, 0.75, 0.75},  // C4: attack traffic (DELETE+sensitive paths)
    };

    // Anomaly score for each cluster (how malicious is membership)
    private static final double[] CLUSTER_ANOMALY = {0.04, 0.08, 0.52, 0.68, 0.88};

    @Override public String getName() { return "KMeans"; }

    @Override
    public double score(HttpLog log) {
        double[] features = extractFeatures(log);

        int    nearest = 0;
        double minDist = Double.MAX_VALUE;
        for (int k = 0; k < CENTROIDS.length; k++) {
            double d = euclidean(features, CENTROIDS[k]);
            if (d < minDist) { minDist = d; nearest = k; }
        }

        double clusterScore  = CLUSTER_ANOMALY[nearest];
        // Distance from centroid within the cluster adds uncertainty signal
        double distanceScore = Math.min(minDist / 1.5, 1.0);

        // Cluster membership drives score; distance is secondary
        return Math.min(0.75 * clusterScore + 0.25 * distanceScore, 1.0);
    }

    private double[] extractFeatures(HttpLog log) {
        double lat     = log.getLatencyMs() != null ? log.getLatencyMs() : 100.0;
        double normLat = Math.max(0, Math.min(1.0, (lat - 40.0) / 500.0));
        return new double[]{
            normLat,
            mapStatus(log.getStatus()),
            mapMethod(log.getMethod()),
            mapPath(log.getEndpoint())
        };
    }

    private double mapStatus(Integer s) {
        if (s == null)             return 0.40;
        if (s >= 200 && s < 300)   return 0.00;
        if (s == 404)              return 0.25;
        if (s == 401)              return 0.60;
        if (s == 403)              return 0.65;
        if (s >= 400 && s < 500)   return 0.50;
        if (s >= 500)              return 0.85;
        return 0.30;
    }

    private double mapMethod(String m) {
        if (m == null) return 0.40;
        return switch (m.toUpperCase()) {
            case "GET"    -> 0.05;
            case "POST"   -> 0.18;
            case "PUT"    -> 0.40;
            case "PATCH"  -> 0.55;
            case "DELETE" -> 0.88;
            default       -> 0.60;
        };
    }

    // Path risk: based on destination type, not attack content (that's RuleBased)
    private double mapPath(String ep) {
        if (ep == null) return 0.20;
        String lower = ep.toLowerCase();
        if (lower.startsWith("/admin"))       return 0.85;
        if (lower.startsWith("/wp-admin"))    return 0.88;
        if (lower.startsWith("/phpmyadmin"))  return 0.90;
        if (lower.startsWith("/.env"))        return 0.92;
        if (lower.startsWith("/api/users"))   return 0.55;
        if (lower.startsWith("/login"))       return 0.60;
        if (lower.startsWith("/api/payment")) return 0.65;
        if (lower.startsWith("/health"))      return 0.04;
        if (lower.startsWith("/static"))      return 0.03;
        if (lower.startsWith("/api/data"))    return 0.25;
        return 0.18;
    }

    private double euclidean(double[] a, double[] b) {
        double s = 0;
        for (int i = 0; i < a.length; i++) { double d = a[i]-b[i]; s += d*d; }
        return Math.sqrt(s);
    }

    @Override public double threshold() { return 0.45; }
}
