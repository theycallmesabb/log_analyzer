package com.securelog.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.securelog.model.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ApiDtos {

    // ── AUTH ──────────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        private String email;
        private String password;
        private String fullName;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String email;
        private String fullName;
        private String role;
        private String message;
    }

    // ── LOGS ──────────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class HttpLogDto {
        private Long id;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime timestamp;
        private String timestampStr;
        private String ip;
        private String method;
        private String endpoint;
        private Integer status;
        private String latency;
        private Boolean anomaly;
        private Double anomalyScore;
        private String detectionAlgorithm;
        private String sourceType;
        private String rawLog;

        public static HttpLogDto from(HttpLog log) {
            return HttpLogDto.builder()
                    .id(log.getId())
                    .timestamp(log.getTimestamp())
                    .timestampStr(log.getTimestamp().toString().replace("T", " ").substring(0, 19))
                    .ip(log.getIpAddress())
                    .method(log.getMethod())
                    .endpoint(log.getEndpoint())
                    .status(log.getStatus())
                    .latency(log.getLatencyMs() + "ms")
                    .anomaly(log.getAnomaly())
                    .anomalyScore(log.getAnomalyScore())
                    .detectionAlgorithm(log.getDetectionAlgorithm())
                    .sourceType(log.getSourceType())
                    .rawLog(log.getRawLog())
                    .build();
        }
    }

    // ── THREATS ───────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ThreatDto {
        private Long id;
        private String type;
        private String severity;
        private String ip;
        private String target;
        private String timestamp;
        private String status;
        private String description;
        private Double anomalyScore;
        private String detectionAlgorithm;
        private Double mlConfidence;

        public static ThreatDto from(Threat t) {
            return ThreatDto.builder()
                    .id(t.getId())
                    .type(t.getType())
                    .severity(t.getSeverity())
                    .ip(t.getIp())
                    .target(t.getTarget())
                    .timestamp(t.getDetectedAt().toString().replace("T", " ").substring(0, 19))
                    .status(t.getStatus())
                    .description(t.getDescription())
                    .anomalyScore(t.getAnomalyScore())
                    .detectionAlgorithm(t.getDetectionAlgorithm())
                    .mlConfidence(t.getMlConfidence())
                    .build();
        }
    }

    // ── ALERTS ────────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AlertDto {
        private Long id;
        private String title;
        private String ip;
        private String severity;
        private String time;
        private Boolean isRead;

        public static AlertDto from(Alert a) {
            return AlertDto.builder()
                    .id(a.getId())
                    .title(a.getTitle())
                    .ip(a.getIp())
                    .severity(a.getSeverity())
                    .time(formatTime(a.getCreatedAt()))
                    .isRead(a.getIsRead())
                    .build();
        }

        private static String formatTime(LocalDateTime dt) {
            if (dt == null) return "unknown";
            long mins = Duration.between(dt, LocalDateTime.now()).toMinutes();
            if (mins < 1)   return "just now";
            if (mins < 60)  return mins + " mins ago";
            long hrs = mins / 60;
            if (hrs < 24)   return hrs + " hour" + (hrs > 1 ? "s" : "") + " ago";
            return dt.toLocalDate().toString();
        }
    }

    // ── LOG SOURCE ────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LogSourceDto {
        private Long id;
        private String name;
        private String type;
        private String description;
        private String host;
        private Integer port;
        private String status;
        private String createdAt;
        private String lastSeen;
        private Long totalLogsReceived;
        private Long anomaliesDetected;

        public static LogSourceDto from(LogSource s) {
            return LogSourceDto.builder()
                    .id(s.getId())
                    .name(s.getName())
                    .type(s.getType())
                    .description(s.getDescription())
                    .host(s.getHost())
                    .port(s.getPort())
                    .status(s.getStatus())
                    .createdAt(s.getCreatedAt().toString().replace("T"," ").substring(0,19))
                    .lastSeen(s.getLastSeen() != null ? s.getLastSeen().toString().replace("T"," ").substring(0,19) : "Never")
                    .totalLogsReceived(s.getTotalLogsReceived())
                    .anomaliesDetected(s.getAnomaliesDetected())
                    .build();
        }
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateLogSourceRequest {
        private String name;
        private String type;
        private String description;
        private String host;
        private Integer port;
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StatValue {
        private String value;
        private String change;
        private Boolean up;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardStatsDto {
        private StatValue totalLogs;
        private StatValue activeAlerts;
        private StatValue suspiciousIPs;
        private StatValue blockedThreats;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TrafficDataPoint {
        private String hour;
        private long requests;
        private long threats;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttackDistItem {
        private String name;
        private long value;
        private String fill;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WeeklyDataPoint {
        private String day;
        private long requests;
        private long threats;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopIpItem {
        private String ip;
        private long requests;
        private long threats;
        private String country;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LogTimelineItem {
        private Long id;
        private String title;
        private String time;
        private String desc;
        private String type;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PagedResponse<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MlAnalysisResult {
        private double ensembleScore;
        private boolean anomaly;
        private String topAlgorithm;
        private Map<String, Double> individualScores;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SeverityCounts {
        private long critical;
        private long high;
        private long medium;
        private long low;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AnalyticsDto {
        private List<WeeklyDataPoint> weeklyData;
        private List<TopIpItem> topIPs;
        private List<AttackDistItem> attackDist;
    }

    // ── REAL-TIME WEBSOCKET ───────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LiveLogEvent {
        private String type; // LOG, ALERT, THREAT
        private Object data;
        private long timestamp;
    }
}
