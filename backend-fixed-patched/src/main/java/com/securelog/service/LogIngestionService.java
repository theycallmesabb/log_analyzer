package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.ml.MlEnsembleService;
import com.securelog.model.*;
import com.securelog.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogIngestionService {

    private final HttpLogRepository logRepository;
    private final ThreatRepository threatRepository;
    private final AlertRepository alertRepository;
    private final MlEnsembleService mlEnsemble;
    private final LogStreamingService streamingService;
    private final LogSourceService logSourceService;

    // ── Patterns ordered from most-specific to most-general ──────────────────

    // 1. Strict Nginx: IP - - [date] "METHOD /path HTTP/x" STATUS BYTES ["ref"] ["ua"]
    private static final Pattern P_NGINX_STRICT = Pattern.compile(
        "^(\\S+)\\s+-\\s+-\\s+\\[([^\\]]+)\\]\\s+\"(\\S+)\\s+(\\S+)(?:\\s+\\S+)?\"\\s+(\\d{3})\\s+(\\S+)(?:\\s+\"[^\"]*\"\\s+\"([^\"]*)\")?.*$"
    );

    // 2. CLF-any: IP ident user [date] "METHOD /path ..." STATUS BYTES ...
    private static final Pattern P_CLF = Pattern.compile(
        "^(\\S+)\\s+\\S+\\s+\\S+\\s+\\[([^\\]]+)\\]\\s+\"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)\\s+(\\S+)[^\"]*\"\\s+(\\d{3})\\s+(\\S+).*$"
    );

    // 3. Quoted-request anywhere: any line with "METHOD /path" STATUS pattern
    private static final Pattern P_QUOTED = Pattern.compile(
        "((?:\\d{1,3}\\.){3}\\d{1,3}|\\S+).*?\"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)\\s+(\\S+)[^\"]*\"\\s+(\\d{3})\\s+(\\S+)"
    );

    // 4. Unquoted: IP METHOD /path STATUS (some syslog / custom formats)
    private static final Pattern P_UNQUOTED = Pattern.compile(
        "((?:\\d{1,3}\\.){3}\\d{1,3})\\s+.*?\\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\\b\\s+(\\S+)\\s+(\\d{3})"
    );

    // RT extraction: rt=, request_time=, RT:, duration=
    private static final Pattern P_RT = Pattern.compile(
        "(?:rt=|request_time=|RT:|duration=)(\\d+\\.?\\d*)"
    );

    private static final Random RNG = new Random();

    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public HttpLogDto ingestRaw(HttpLog log) {
        return runMlAndSave(log);
    }

    @Transactional
    public HttpLogDto ingestNginxLine(String line, Long sourceId) {
        HttpLog parsed = parseLine(line, sourceId, "NGINX");
        if (parsed == null) return null;
        return runMlAndSave(parsed);
    }

    @Transactional
    public HttpLogDto ingestApacheLine(String line, Long sourceId) {
        HttpLog parsed = parseLine(line, sourceId, "APACHE");
        if (parsed == null) return null;
        return runMlAndSave(parsed);
    }

    @Transactional
    public int ingestBulkLines(String[] lines, String format, Long sourceId) {
        int count = 0;
        for (String line : lines) {
            if (line == null || line.isBlank()) continue;
            try {
                HttpLog parsed = parseLine(line, sourceId, format);
                if (parsed != null) {
                    runMlAndSave(parsed);
                    count++;
                }
            } catch (Exception e) {
                log.debug("Skipping line: {}", e.getMessage());
            }
        }
        return count;
    }

    /**
     * Universal parser — tries 4 patterns in order, returns first match.
     * Never returns null for a line that contains an HTTP method + status code.
     */
    public HttpLog parseLine(String raw, Long sourceId, String srcType) {
        if (raw == null || raw.isBlank()) return null;
        String line = raw.trim();

        // Pattern 1 — strict nginx/CLF
        Matcher m = P_NGINX_STRICT.matcher(line);
        if (m.matches()) {
            return buildFromGroups(m.group(1), m.group(3), m.group(4),
                    safeInt(m.group(5), 200), safeLong(m.group(6), 0),
                    m.groupCount() >= 7 ? m.group(7) : null,
                    srcType, sourceId, line);
        }

        // Pattern 2 — any CLF (nginx/apache with ident/user)
        m = P_CLF.matcher(line);
        if (m.matches()) {
            return buildFromGroups(m.group(1), m.group(3), m.group(4),
                    safeInt(m.group(5), 200), safeLong(m.group(6), 0),
                    null, srcType, sourceId, line);
        }

        // Pattern 3 — quoted request anywhere in line
        m = P_QUOTED.matcher(line);
        if (m.find()) {
            return buildFromGroups(m.group(1), m.group(2), m.group(3),
                    safeInt(m.group(4), 200), safeLong(m.group(5), 0),
                    null, srcType, sourceId, line);
        }

        // Pattern 4 — unquoted method
        m = P_UNQUOTED.matcher(line);
        if (m.find()) {
            return buildFromGroups(m.group(1), m.group(2), m.group(3),
                    safeInt(m.group(4), 200), 0L,
                    null, srcType, sourceId, line);
        }

        // Pattern 5 — last resort: extract IP + status from anywhere
        return lastResortParse(line, sourceId, srcType);
    }

    /**
     * Last resort: if line has an IP and a 3-digit status, we can still score it.
     * Many syslog / journald lines fall here.
     */
    private HttpLog lastResortParse(String line, Long sourceId, String srcType) {
        // Must have at least a status code to be meaningful
        Matcher statusM = Pattern.compile("\\b([2-5]\\d{2})\\b").matcher(line);
        if (!statusM.find()) return null;
        int status = Integer.parseInt(statusM.group(1));

        // IP
        Matcher ipM = Pattern.compile("((?:\\d{1,3}\\.){3}\\d{1,3})").matcher(line);
        String ip = ipM.find() ? ipM.group(1) : "0.0.0.0";

        // Method
        Matcher methM = Pattern.compile("\\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\\b").matcher(line);
        String method = methM.find() ? methM.group(1) : "GET";

        // Endpoint: first path-like token
        Matcher epM = Pattern.compile("\"?(/[^\\s\"?#]*)").matcher(line);
        String endpoint = epM.find() ? epM.group(1) : "/";

        int latency = simulateLatency(status);
        return buildLog(ip, method, endpoint, status, latency, srcType, sourceId, line, null);
    }

    // ── ML + Save ─────────────────────────────────────────────────────────────

    private HttpLogDto runMlAndSave(HttpLog httpLog) {
        if (httpLog.getTimestamp() == null) httpLog.setTimestamp(LocalDateTime.now());
        if (httpLog.getAnomaly()   == null) httpLog.setAnomaly(false);
        if (httpLog.getSourceType()== null) httpLog.setSourceType("API");

        MlEnsembleService.EnsembleResult result = mlEnsemble.analyze(httpLog);
        httpLog.setAnomalyScore(result.score());
        httpLog.setAnomaly(result.isAnomaly());
        httpLog.setDetectionAlgorithm(result.topAlgorithm());

        HttpLog saved = logRepository.save(httpLog);

        if (saved.getSourceId() != null) {
            logSourceService.updateSourceStats(saved.getSourceId(), saved.getAnomaly());
        }

        streamingService.broadcastLog(saved);

        if (saved.getAnomaly() && saved.getAnomalyScore() >= 0.50) {
            autoCreateAlert(saved);
        }

        log.debug("id={} anomaly={} score={} alg={}",
                saved.getId(), saved.getAnomaly(),
                String.format("%.2f", saved.getAnomalyScore()), saved.getDetectionAlgorithm());
        return HttpLogDto.from(saved);
    }

    private void autoCreateAlert(HttpLog log) {
        String severity = log.getAnomalyScore() >= 0.85 ? "critical"
                        : log.getAnomalyScore() >= 0.70 ? "high"
                        : log.getAnomalyScore() >= 0.55 ? "medium" : "low";

        Alert alert = Alert.builder()
                .title(buildAlertTitle(log))
                .ip(log.getIpAddress())
                .severity(severity)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
        alertRepository.save(alert);

        if (log.getAnomalyScore() >= 0.65) {
            Threat threat = Threat.builder()
                    .type(classifyThreatType(log))
                    .severity(severity)
                    .ip(log.getIpAddress())
                    .target(log.getEndpoint())
                    .detectedAt(LocalDateTime.now())
                    .status("Monitored")
                    .description("Auto-detected by ML ensemble. Algorithm: "
                            + log.getDetectionAlgorithm()
                            + ". Score: " + String.format("%.2f", log.getAnomalyScore()))
                    .anomalyScore(log.getAnomalyScore())
                    .detectionAlgorithm(log.getDetectionAlgorithm())
                    .mlConfidence(log.getAnomalyScore())
                    .rawLogId(log.getId())
                    .build();
            threatRepository.save(threat);
        }
    }

    private String buildAlertTitle(HttpLog log) {
        if (log.getStatus() != null && log.getStatus() >= 500) return "Server Error Spike Detected";
        if (log.getStatus() != null && log.getStatus() == 401) return "Unauthorized Access Attempt";
        if (log.getStatus() != null && log.getStatus() == 403) return "Forbidden Request Flagged";
        if ("DELETE".equals(log.getMethod()))                   return "Suspicious DELETE Operation";
        String ep = log.getEndpoint() != null ? log.getEndpoint() : "";
        if (ep.contains("admin"))                               return "Admin Endpoint Probed";
        if (ep.contains("union") || ep.contains("select"))     return "SQL Injection Attempt";
        return "Anomaly Detected from " + log.getIpAddress();
    }

    private String classifyThreatType(HttpLog log) {
        String ep = log.getEndpoint() != null ? log.getEndpoint().toLowerCase() : "";
        if (ep.contains("union") || ep.contains("select")) return "SQL Injection";
        if (ep.contains("script"))                         return "XSS Attempt";
        if (ep.contains("../") || ep.contains("passwd"))   return "Path Traversal";
        if ("DELETE".equals(log.getMethod()))              return "Unauthorized Deletion";
        if (log.getStatus() != null && log.getStatus() == 401) return "Brute Force";
        return "Anomalous Traffic";
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpLog buildFromGroups(String ip, String method, String endpoint,
                                     int status, long bytes, String ua,
                                     String srcType, Long sourceId, String rawLine) {
        int latency = extractLatency(rawLine, status);
        return buildLog(ip, method, endpoint, status, latency, srcType, sourceId, rawLine, ua);
    }

    private int extractLatency(String line, int status) {
        Matcher rtM = P_RT.matcher(line);
        if (rtM.find()) {
            try {
                double rt = Double.parseDouble(rtM.group(1));
                return rt < 60 ? (int)(rt * 1000) : (int) rt;
            } catch (Exception ignored) {}
        }
        return simulateLatency(status);
    }

    private int simulateLatency(int status) {
        int base;
        if      (status >= 500)              base = 800  + RNG.nextInt(1200);
        else if (status == 429)              base = 600  + RNG.nextInt(400);
        else if (status == 401 || status == 403) base = 180 + RNG.nextInt(200);
        else if (status == 404)              base = 90   + RNG.nextInt(80);
        else if (status >= 400)              base = 250  + RNG.nextInt(300);
        else                                 base = 40   + RNG.nextInt(160);
        return Math.min(base, 3000);
    }

    private HttpLog buildLog(String ip, String method, String endpoint, int status,
                              int latency, String srcType, Long sourceId,
                              String rawLine, String userAgent) {
        if (endpoint != null && endpoint.length() > 255) endpoint = endpoint.substring(0, 255);
        return HttpLog.builder()
                .timestamp(LocalDateTime.now())
                .ipAddress(ip)
                .method(method)
                .endpoint(endpoint)
                .status(status)
                .latencyMs(latency)
                .anomaly(false)
                .anomalyScore(0.0)
                .detectionAlgorithm("None")
                .sourceType(srcType)
                .sourceId(sourceId)
                .userAgent(userAgent != null && userAgent.length() > 500
                        ? userAgent.substring(0, 500) : userAgent)
                .rawLog(rawLine != null && rawLine.length() > 1000
                        ? rawLine.substring(0, 1000) : rawLine)
                .build();
    }

    private int safeInt(String s, int def) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return def; }
    }
    private long safeLong(String s, long def) {
        try { return Long.parseLong(s.trim()); } catch (Exception e) { return def; }
    }
}
