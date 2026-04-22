package com.securelog.ml;

import com.securelog.model.HttpLog;
import org.springframework.stereotype.Component;

/**
 * Algorithm 5: Naive Bayes Detector
 *
 * PRIMARY domain: probabilistic baseline scoring.
 * Acts as a calibrated background signal — neither too aggressive
 * nor too passive. Good at catching anomalies that don't fire other detectors.
 *
 * Gaussian Naive Bayes with Laplace smoothing.
 * P(anomaly | features) ∝ P(anomaly) × ∏ P(feature_i | anomaly)
 */
@Component
public class NaiveBayesDetector implements AnomalyDetector {

    private static final double PRIOR_ANOMALY = 0.18; // ~18% of HTTP traffic anomalous
    private static final double PRIOR_NORMAL  = 0.82;

    // Gaussian latency params: (mean_ms, std_ms)
    private static final double LAT_MEAN_NORMAL  = 95.0;
    private static final double LAT_STD_NORMAL   = 45.0;
    private static final double LAT_MEAN_ANOMALY = 420.0;
    private static final double LAT_STD_ANOMALY  = 380.0;

    // P(status_bucket | class) — [normal, anomaly]
    // Buckets: 0=2xx, 1=3xx, 2=4xx-non-401/403, 3=401, 4=403, 5=5xx
    private static final double[][] STATUS_P = {
        {0.82, 0.18},  // 2xx
        {0.08, 0.04},  // 3xx
        {0.06, 0.22},  // 4xx generic
        {0.02, 0.24},  // 401
        {0.01, 0.16},  // 403
        {0.01, 0.16},  // 5xx
    };

    // P(method | class) — [normal, anomaly]
    // Indices: GET=0, POST=1, PUT=2, DELETE=3, PATCH=4, OTHER=5
    private static final double[][] METHOD_P = {
        {0.68, 0.22},  // GET
        {0.22, 0.28},  // POST
        {0.05, 0.14},  // PUT
        {0.02, 0.22},  // DELETE
        {0.02, 0.08},  // PATCH
        {0.01, 0.06},  // OTHER
    };

    @Override public String getName() { return "NaiveBayes"; }

    @Override
    public double score(HttpLog log) {
        double logN = Math.log(PRIOR_NORMAL);
        double logA = Math.log(PRIOR_ANOMALY);

        // Latency feature
        if (log.getLatencyMs() != null) {
            double lat = log.getLatencyMs();
            logN += Math.log(gaussianPdf(lat, LAT_MEAN_NORMAL,  LAT_STD_NORMAL)  + 1e-10);
            logA += Math.log(gaussianPdf(lat, LAT_MEAN_ANOMALY, LAT_STD_ANOMALY) + 1e-10);
        }

        // Status feature
        int sb = statusBucket(log.getStatus());
        logN += Math.log(STATUS_P[sb][0] + 1e-10);
        logA += Math.log(STATUS_P[sb][1] + 1e-10);

        // Method feature
        int mi = methodIndex(log.getMethod());
        logN += Math.log(METHOD_P[mi][0] + 1e-10);
        logA += Math.log(METHOD_P[mi][1] + 1e-10);

        // Softmax → P(anomaly)
        double maxLog    = Math.max(logN, logA);
        double expN      = Math.exp(logN - maxLog);
        double expA      = Math.exp(logA - maxLog);
        return expA / (expN + expA);
    }

    private double gaussianPdf(double x, double mean, double std) {
        double v = std * std;
        return Math.exp(-(x - mean) * (x - mean) / (2.0 * v))
               / (Math.sqrt(2.0 * Math.PI * v) + 1e-10);
    }

    private int statusBucket(Integer s) {
        if (s == null)             return 0;
        if (s >= 200 && s < 300)   return 0;
        if (s >= 300 && s < 400)   return 1;
        if (s == 401)              return 3;
        if (s == 403)              return 4;
        if (s >= 400 && s < 500)   return 2;
        if (s >= 500)              return 5;
        return 0;
    }

    private int methodIndex(String m) {
        if (m == null) return 5;
        return switch (m.toUpperCase()) {
            case "GET"    -> 0;
            case "POST"   -> 1;
            case "PUT"    -> 2;
            case "DELETE" -> 3;
            case "PATCH"  -> 4;
            default       -> 5;
        };
    }

    @Override public double threshold() { return 0.40; }
}
