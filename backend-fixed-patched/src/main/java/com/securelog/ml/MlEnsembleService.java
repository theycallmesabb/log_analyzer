package com.securelog.ml;

import com.securelog.model.HttpLog;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * ML Ensemble Service — Weighted voting across 5 anomaly detectors.
 *
 * ENSEMBLE WEIGHTS (for final score):
 *   RuleBased       0.35  — highest: expert rules are most reliable
 *   ZScore          0.20  — statistical timing/volume anomalies
 *   KMeans          0.20  — behavioral cluster anomalies
 *   IsolationForest 0.15  — general structural anomalies (fallback)
 *   NaiveBayes      0.10  — probabilistic baseline
 *
 * TOP ALGORITHM SELECTION BIAS WEIGHTS:
 *   RuleBased       1.30  — strongly prefer when rule fires
 *   ZScore          1.15  — prefer for latency/timing anomalies
 *   KMeans          1.00  — neutral
 *   IsolationForest 0.75  — penalized — fallback only
 *   NaiveBayes      0.85  — slightly penalized
 *
 * This two-weight system means:
 *   - Ensemble score = fair weighted average (accuracy)
 *   - Top algorithm  = biased attribution (readability/diversity)
 *
 * Result: RuleBased dominates attack patterns, ZScore dominates latency spikes,
 * KMeans handles behavioral clusters, IsolationForest is last resort.
 *
 * Anomaly threshold: ensemble score >= 0.30 (sensitive enough for real attacks)
 */
@Service
public class MlEnsembleService {

    // Order: RuleBased, ZScore, KMeans, IsolationForest, NaiveBayes
    private final List<AnomalyDetector> detectors;

    // Ensemble weights — used to compute final score
    private static final double[] ENSEMBLE_WEIGHTS = {0.35, 0.20, 0.20, 0.15, 0.10};

    // Attribution bias weights — used only to pick topAlgorithm
    // Higher = more likely to be credited when scores are close
    private static final double[] ATTRIBUTION_BIAS = {1.30, 1.15, 1.00, 0.75, 0.85};

    public MlEnsembleService(
            RuleBasedDetector       ruleBasedDetector,
            ZScoreDetector          zScoreDetector,
            KMeansDetector          kMeansDetector,
            IsolationForestDetector isolationForestDetector,
            NaiveBayesDetector      naiveBayesDetector) {
        this.detectors = List.of(
                ruleBasedDetector,
                zScoreDetector,
                kMeansDetector,
                isolationForestDetector,
                naiveBayesDetector
        );
    }

    public EnsembleResult analyze(HttpLog log) {
        double[] rawScores = new double[detectors.size()];

        // Step 1: collect raw scores from each detector
        for (int i = 0; i < detectors.size(); i++) {
            rawScores[i] = detectors.get(i).score(log);
        }

        // Step 2: compute ensemble score (weighted average)
        double weightedSum = 0.0;
        for (int i = 0; i < detectors.size(); i++) {
            weightedSum += rawScores[i] * ENSEMBLE_WEIGHTS[i];
        }
        // ENSEMBLE_WEIGHTS sum to 1.0 — no division needed
        double ensembleScore = Math.min(weightedSum, 1.0);
        boolean isAnomaly    = ensembleScore >= 0.30;

        // Step 3: pick topAlgorithm using score × attribution_bias
        // This ensures RuleBased wins credit for attack patterns,
        // ZScore wins for latency, etc.
        String topAlgorithm  = "None";
        double topBiasedScore = -1.0;
        for (int i = 0; i < detectors.size(); i++) {
            double biased = rawScores[i] * ATTRIBUTION_BIAS[i];
            if (biased > topBiasedScore) {
                topBiasedScore = biased;
                topAlgorithm   = detectors.get(i).getName();
            }
        }

        // Step 4: build individual scores map
        Map<String, Double> individualScores = new LinkedHashMap<>();
        for (int i = 0; i < detectors.size(); i++) {
            individualScores.put(detectors.get(i).getName(), rawScores[i]);
        }

        return new EnsembleResult(ensembleScore, isAnomaly, topAlgorithm, individualScores);
    }

    public record EnsembleResult(
            double score,
            boolean isAnomaly,
            String topAlgorithm,
            Map<String, Double> individualScores
    ) {}
}
