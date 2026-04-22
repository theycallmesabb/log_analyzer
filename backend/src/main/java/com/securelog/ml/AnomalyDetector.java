package com.securelog.ml;

import com.securelog.model.HttpLog;

/**
 * Common interface for all anomaly detection algorithms.
 * Each algorithm returns a score between 0.0 (normal) and 1.0 (anomalous).
 */
public interface AnomalyDetector {

    String getName();

    /**
     * Compute anomaly score for a single log entry.
     * @return score in [0.0, 1.0]
     */
    double score(HttpLog log);

    /**
     * Threshold above which a log is considered anomalous.
     */
    default double threshold() {
        return 0.5;
    }

    default boolean isAnomaly(HttpLog log) {
        return score(log) >= threshold();
    }
}
