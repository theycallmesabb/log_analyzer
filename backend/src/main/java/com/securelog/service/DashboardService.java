package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.repository.HttpLogRepository;
import com.securelog.repository.ThreatRepository;
import com.securelog.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final HttpLogRepository logRepository;
    private final ThreatRepository threatRepository;
    private final AlertRepository alertRepository;

    private static final DateTimeFormatter HOUR_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        LocalDateTime now    = LocalDateTime.now();
        LocalDateTime prev24 = now.minusHours(24);
        LocalDateTime prev48 = now.minusHours(48);

        long totalLogs   = logRepository.count();
        long logsLast24  = logRepository.countByTimestampAfter(prev24);
        long logsPrior24 = logRepository.countByTimestampBetween(prev48, prev24);
        String logChange = computeChange(logsLast24, logsPrior24);
        Boolean logUp    = logsLast24 >= logsPrior24;

        long alerts       = alertRepository.countByIsReadFalse();
        long alertsToday  = alertRepository.countCreatedBetween(prev24, now);
        long alertsYest   = alertRepository.countCreatedBetween(prev48, prev24);
        String alertChange= computeChange(alertsToday, alertsYest);
        Boolean alertUp   = alertsToday >= alertsYest;

        long suspIPs      = threatRepository.findAllByOrderByDetectedAtDesc()
                           .stream().map(t -> t.getIp()).distinct().count();
        long suspIPsToday = threatRepository.findByDetectedAtBetween(prev24, now)
                           .stream().map(t -> t.getIp()).distinct().count();
        long suspIPsYest  = threatRepository.findByDetectedAtBetween(prev48, prev24)
                           .stream().map(t -> t.getIp()).distinct().count();
        String suspChange  = computeChange(suspIPsToday, suspIPsYest);
        Boolean suspUp     = suspIPsToday > suspIPsYest ? Boolean.TRUE
                           : suspIPsToday < suspIPsYest ? Boolean.FALSE : null;

        long blocked       = threatRepository.countByStatus("Blocked");
        long blockedToday  = threatRepository.countByStatusAndDetectedAtBetween("Blocked", prev24, now);
        long blockedYest   = threatRepository.countByStatusAndDetectedAtBetween("Blocked", prev48, prev24);
        String blockedChange = computeChange(blockedToday, blockedYest);
        Boolean blockedUp  = blockedToday >= blockedYest;

        return DashboardStatsDto.builder()
                .totalLogs(StatValue.builder()
                        .value(formatCount(totalLogs)).change(logChange).up(logUp).build())
                .activeAlerts(StatValue.builder()
                        .value(String.valueOf(alerts)).change(alertChange).up(alertUp).build())
                .suspiciousIPs(StatValue.builder()
                        .value(String.valueOf(suspIPs)).change(suspChange).up(suspUp).build())
                .blockedThreats(StatValue.builder()
                        .value(formatCount(blocked)).change(blockedChange).up(blockedUp).build())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TrafficDataPoint> getTrafficData() {
        List<TrafficDataPoint> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 23; i >= 0; i--) {
            LocalDateTime start = now.minusHours(i + 1);
            LocalDateTime end   = now.minusHours(i);
            String label = end.format(HOUR_FMT);
            List<com.securelog.model.HttpLog> logsInWindow = logRepository.findByTimestampBetween(start, end);
            long requests = logsInWindow.size();
            long threats  = logsInWindow.stream().filter(l -> Boolean.TRUE.equals(l.getAnomaly())).count();
            result.add(TrafficDataPoint.builder().hour(label).requests(requests).threats(threats).build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<AttackDistItem> getAttackDistribution() {
        List<Object[]> typeCounts = threatRepository.countByType();
        Map<String, String> colorMap = new LinkedHashMap<>();
        colorMap.put("SQL Injection",         "#ff4560");
        colorMap.put("XSS Attempt",           "#ff8c00");
        colorMap.put("Brute Force",           "#ffbb00");
        colorMap.put("DDoS Attempt",          "#4f8eff");
        colorMap.put("Endpoint Scanning",     "#00d084");
        colorMap.put("Path Traversal",        "#9b59b6");
        colorMap.put("Suspicious User Agent", "#00d4d4");
        colorMap.put("Anomalous Traffic",     "#888888");
        colorMap.put("Unauthorized Deletion", "#e74c3c");
        return typeCounts.stream()
                .map(row -> AttackDistItem.builder()
                        .name(row[0].toString())
                        .value(((Number) row[1]).longValue())
                        .fill(colorMap.getOrDefault(row[0].toString(), "#888"))
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LogTimelineItem> getLogTimeline() {
        List<com.securelog.model.Alert> alerts = alertRepository.findTop10ByOrderByCreatedAtDesc();
        List<LogTimelineItem> items = new ArrayList<>();
        for (com.securelog.model.Alert a : alerts) {
            String type = switch (a.getSeverity()) {
                case "critical", "high" -> "error";
                case "medium"           -> "warning";
                default                 -> "success";
            };
            items.add(LogTimelineItem.builder()
                    .id(a.getId()).title(a.getTitle())
                    .time(a.getCreatedAt().format(DateTimeFormatter.ofPattern("hh:mm a")))
                    .desc("IP " + a.getIp() + " triggered " + a.getSeverity().toUpperCase() + " alert")
                    .type(type).build());
            if (items.size() >= 5) break;
        }
        if (items.isEmpty()) {
            items.add(LogTimelineItem.builder().id(100L).title("System Online")
                    .time("Now").desc("SecureLog platform is running and monitoring traffic.").type("success").build());
        }
        return items;
    }

    private String computeChange(long current, long previous) {
        if (previous == 0 && current == 0) return "no activity";
        if (previous == 0) return "new data";
        double pct = (double)(current - previous) / previous * 100;
        if (Math.abs(pct) < 0.1) return "stable";
        return (pct >= 0 ? "+" : "") + String.format("%.1f%%", pct);
    }

    private String formatCount(long count) {
        if (count >= 1_000_000) return String.format("%.1fM", count / 1_000_000.0);
        if (count >= 1_000)     return String.format("%.1fK", count / 1_000.0);
        return String.valueOf(count);
    }
}
