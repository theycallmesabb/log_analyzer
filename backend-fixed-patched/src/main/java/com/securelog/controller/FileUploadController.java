package com.securelog.controller;

import com.securelog.dto.ApiDtos.*;
import com.securelog.ml.MlEnsembleService;
import com.securelog.model.HttpLog;
import com.securelog.model.LogSource;
import com.securelog.repository.LogSourceRepository;
import com.securelog.service.LogIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final LogIngestionService logIngestionService;
    private final LogSourceRepository logSourceRepository;
    private final MlEnsembleService mlEnsemble;

    @PostMapping
    public ResponseEntity<UploadAnalysisResult> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "format", defaultValue = "AUTO") String format,
            @RequestParam(value = "sourceId", required = false) Long sourceId) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().build();

            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            String[] lines = content.split("\\n");

            String detectedFormat = format.equalsIgnoreCase("AUTO")
                    ? detectFormat(lines) : format.toUpperCase();

            Long resolvedSourceId = resolveSourceId(sourceId, file.getOriginalFilename());

            return ResponseEntity.ok(analyzeLines(
                    lines, detectedFormat, resolvedSourceId, file.getOriginalFilename()));

        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/paste")
    public ResponseEntity<UploadAnalysisResult> pasteLogs(@RequestBody Map<String, String> body) {
        String content = body.getOrDefault("content", "");
        String format  = body.getOrDefault("format", "AUTO");
        if (content.isBlank()) return ResponseEntity.badRequest().build();

        String[] lines = content.split("\\n");
        String detectedFormat = format.equalsIgnoreCase("AUTO")
                ? detectFormat(lines) : format.toUpperCase();
        Long resolvedSourceId = resolveSourceId(null, "Paste Upload");

        return ResponseEntity.ok(analyzeLines(lines, detectedFormat, resolvedSourceId, "Pasted Content"));
    }

    // ── Core analysis ─────────────────────────────────────────────────────────

    private UploadAnalysisResult analyzeLines(String[] lines, String detectedFormat,
                                               Long resolvedSourceId, String filename) {
        List<LineResult>       lineResults   = new ArrayList<>();
        int                    processed     = 0;
        int                    anomalyCount  = 0;
        Map<String, Integer>   algorithmHits = new LinkedHashMap<>();
        Map<String, Integer>   statusCounts  = new LinkedHashMap<>();
        Map<String, Integer>   methodCounts  = new LinkedHashMap<>();
        double                 totalScore    = 0.0;

        int limit = Math.min(lines.length, 5000);

        for (int i = 0; i < limit; i++) {
            String line = lines[i];
            if (line == null || line.isBlank()) continue;

            try {
                // Parse using universal parser
                HttpLog parsed = logIngestionService.parseLine(line, resolvedSourceId, detectedFormat);
                if (parsed == null) continue;

                // Run ML directly (don't persist during bulk file upload analysis —
                // we just need the scores for display; persistence is handled by ingest)
                MlEnsembleService.EnsembleResult mlResult = mlEnsemble.analyze(parsed);
                parsed.setAnomalyScore(mlResult.score());
                parsed.setAnomaly(mlResult.isAnomaly());
                parsed.setDetectionAlgorithm(mlResult.topAlgorithm());

                processed++;
                totalScore += mlResult.score();

                if (mlResult.isAnomaly()) {
                    anomalyCount++;
                    String algo = mlResult.topAlgorithm() != null ? mlResult.topAlgorithm() : "Unknown";
                    algorithmHits.merge(algo, 1, Integer::sum);
                }

                String statusKey = parsed.getStatus() != null
                        ? (parsed.getStatus() / 100) + "xx" : "unknown";
                statusCounts.merge(statusKey, 1, Integer::sum);

                if (parsed.getMethod() != null) {
                    methodCounts.merge(parsed.getMethod(), 1, Integer::sum);
                }

                if (lineResults.size() < 200) {
                    lineResults.add(new LineResult(
                            (long)(i + 1),
                            parsed.getIpAddress(),
                            parsed.getMethod(),
                            parsed.getEndpoint(),
                            parsed.getStatus(),
                            parsed.getLatencyMs() + "ms",
                            parsed.getAnomaly(),
                            parsed.getAnomalyScore(),
                            parsed.getDetectionAlgorithm(),
                            LocalDateTime.now().toString().replace("T", " ").substring(0, 19),
                            detectedFormat
                    ));
                }
            } catch (Exception e) {
                log.debug("Skipping line {}: {}", i + 1, e.getMessage());
            }
        }

        double avgScore    = processed > 0 ? totalScore / processed : 0.0;
        double anomalyRate = processed > 0 ? (double) anomalyCount / processed * 100 : 0.0;
        final int finalProcessed = processed;

        List<AlgoBreakdown> algoBreakdown = algorithmHits.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(e -> new AlgoBreakdown(
                        e.getKey(),
                        e.getValue(),
                        finalProcessed > 0 ? (double) e.getValue() / finalProcessed * 100 : 0
                ))
                .toList();

        String overallSeverity = anomalyRate >= 30 ? "critical"
                : anomalyRate >= 15 ? "high"
                : anomalyRate >= 5  ? "medium" : "low";

        return new UploadAnalysisResult(
                filename,
                lines.length,
                processed,
                anomalyCount,
                Math.round(anomalyRate * 10.0) / 10.0,
                Math.round(avgScore * 1000.0) / 1000.0,
                detectedFormat,
                overallSeverity,
                lineResults,
                algoBreakdown,
                statusCounts,
                methodCounts,
                resolvedSourceId
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String detectFormat(String[] lines) {
        for (String line : lines) {
            if (line == null || line.isBlank()) continue;
            // Apache has 3 fields before [date]: IP ident user
            if (line.matches("^\\S+ \\S+ \\S+ \\[.*")) {
                // Nginx is IP - - specifically
                if (line.matches("^\\S+ - - \\[.*")) return "NGINX";
                return "APACHE";
            }
            if (line.matches("^\\S+ - - \\[.*")) return "NGINX";
        }
        return "NGINX";
    }

    private Long resolveSourceId(Long requestedId, String filename) {
        if (requestedId != null && logSourceRepository.existsById(requestedId)) return requestedId;
        return logSourceRepository.findAll().stream()
                .filter(s -> "FILE_UPLOAD".equals(s.getType()))
                .findFirst()
                .map(LogSource::getId)
                .orElseGet(() -> {
                    LogSource src = LogSource.builder()
                            .name("File Upload")
                            .type("FILE_UPLOAD")
                            .description("Auto-created for file uploads")
                            .status("ACTIVE")
                            .createdAt(LocalDateTime.now())
                            .totalLogsReceived(0L)
                            .anomaliesDetected(0L)
                            .build();
                    return logSourceRepository.save(src).getId();
                });
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record LineResult(
            Long lineNumber, String ip, String method, String endpoint,
            Integer status, String latency, Boolean anomaly, Double anomalyScore,
            String detectionAlgorithm, String timestamp, String sourceType) {}

    public record AlgoBreakdown(String algorithm, int count, double percentage) {}

    public record UploadAnalysisResult(
            String filename, int totalLines, int processedLines, int anomalyCount,
            double anomalyRate, double avgAnomalyScore, String detectedFormat,
            String overallSeverity, List<LineResult> results,
            List<AlgoBreakdown> algorithmBreakdown,
            Map<String, Integer> statusBreakdown, Map<String, Integer> methodBreakdown,
            Long sourceId) {}
}
