package com.securelog.ml;

import com.securelog.model.HttpLog;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.springframework.stereotype.Component;

/**
 * Algorithm 2: Z-Score Statistical Detector
 *
 * PRIMARY domain: latency anomalies (DDoS, slow-loris, server overload).
 * SECONDARY: statistical deviation in status patterns.
 * Should DOMINATE when latency is the main signal (high latency + 5xx).
 * Deliberately weak for pattern-based attacks (SQLi, XSS) — those belong to RuleBased.
 */
@Component
public class ZScoreDetector implements AnomalyDetector {

    // Baseline: normal traffic 75–120ms
    private static final double[] BASELINE_LATENCIES = {
        82, 91, 77, 108, 94, 101, 87, 75, 118, 97,
        104, 83, 90, 112, 86, 93, 79, 107, 96, 84
    };

    private final double baselineMean;
    private final double baselineStdDev;

    public ZScoreDetector() {
        DescriptiveStatistics stats = new DescriptiveStatistics(BASELINE_LATENCIES);
        this.baselineMean   = stats.getMean();     // ~93ms
        this.baselineStdDev = stats.getStandardDeviation(); // ~13ms
    }

    @Override public String getName() { return "ZScore"; }

    @Override
    public double score(HttpLog log) {
        double latencyScore = 0.0;
        double statusScore  = 0.0;

        // ── Latency z-score (primary signal) ─────────────────────────────────
        if (log.getLatencyMs() != null) {
            double lat    = log.getLatencyMs();
            double zScore = Math.abs((lat - baselineMean) / (baselineStdDev + 1e-6));
            // z=0→0.04, z=2→0.35, z=3→0.65, z=5+→0.95
            latencyScore = sigmoid(zScore, 3.0, 1.5);

            // High latency alone is a strong signal for this detector
            if (lat > 1500) latencyScore = Math.max(latencyScore, 0.85);
            else if (lat > 800) latencyScore = Math.max(latencyScore, 0.65);
            else if (lat > 400) latencyScore = Math.max(latencyScore, 0.40);
        }

        // ── Status-based statistical signal (secondary) ──────────────────────
        // ZScore focuses on volumetric/timing anomalies, not rule violations
        if (log.getStatus() != null) {
            int s = log.getStatus();
            if      (s >= 500)              statusScore = 0.60; // server errors → likely overload
            else if (s == 429)              statusScore = 0.75; // rate limiting firing
            else if (s == 401)              statusScore = 0.25; // auth fail — mild signal here
            else if (s == 403)              statusScore = 0.20;
            else if (s >= 400)              statusScore = 0.15;
            // 2xx is normal — no score
        }

        // ZScore should dominate when BOTH latency AND status are anomalous
        // (classic DDoS / overloaded server pattern)
        double combined = 0.70 * latencyScore + 0.30 * statusScore;
        return Math.min(combined, 1.0);
    }

    private double sigmoid(double x, double midpoint, double steepness) {
        return 1.0 / (1.0 + Math.exp(-steepness * (x - midpoint)));
    }

    @Override public double threshold() { return 0.45; }
}
