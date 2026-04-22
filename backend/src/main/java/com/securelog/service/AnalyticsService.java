package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.repository.HttpLogRepository;
import com.securelog.repository.ThreatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final HttpLogRepository logRepository;
    private final ThreatRepository threatRepository;

    private static final Map<String, String> COUNTRY_MAP = Map.of(
            "45.22.11.9",   "RU",
            "192.168.1.45", "US",
            "88.14.22.1",   "CN",
            "112.55.33.2",  "BR",
            "77.88.55.60",  "DE",
            "172.16.254.1", "US",
            "91.108.4.11",  "RU",
            "203.0.113.42", "KR"
    );

    @Transactional(readOnly = true)
    public List<WeeklyDataPoint> getWeeklyData() {
        LocalDateTime now = LocalDateTime.now();
        List<WeeklyDataPoint> result = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd   = dayStart.plusDays(1);

            List<com.securelog.model.HttpLog> dayLogs =
                    logRepository.findByTimestampBetween(dayStart, dayEnd);

            long requests = dayLogs.size();
            long threats  = dayLogs.stream().filter(l -> l.getAnomaly()).count();

            String dayName = dayStart.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            result.add(WeeklyDataPoint.builder()
                    .day(dayName)
                    .requests(requests)
                    .threats(threats)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<TopIpItem> getTopIPs() {
        List<Object[]> raw = logRepository.findTopIPs(PageRequest.of(0, 10));
        List<TopIpItem> result = new ArrayList<>();

        for (Object[] row : raw) {
            String ip = row[0].toString();
            long requests = ((Number) row[1]).longValue();

            // Count threats for this IP
            long threats = threatRepository.findByIp(ip).size();

            result.add(TopIpItem.builder()
                    .ip(ip)
                    .requests(requests)
                    .threats(threats)
                    .country(COUNTRY_MAP.getOrDefault(ip, "XX"))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public AnalyticsDto getFullAnalytics() {
        return AnalyticsDto.builder()
                .weeklyData(getWeeklyData())
                .topIPs(getTopIPs())
                .attackDist(getAttackDist())
                .build();
    }

    private List<AttackDistItem> getAttackDist() {
        List<Object[]> typeCounts = threatRepository.countByType();
        Map<String, String> colorMap = new LinkedHashMap<>();
        colorMap.put("SQL Injection",         "#ff4560");
        colorMap.put("XSS Attempt",           "#ff8c00");
        colorMap.put("Brute Force",           "#ffbb00");
        colorMap.put("DDoS Attempt",          "#4f8eff");
        colorMap.put("Endpoint Scanning",     "#00d084");
        colorMap.put("Path Traversal",        "#9b59b6");
        colorMap.put("Suspicious User Agent", "#00d4d4");

        return typeCounts.stream()
                .map(row -> AttackDistItem.builder()
                        .name(row[0].toString())
                        .value(((Number) row[1]).longValue())
                        .fill(colorMap.getOrDefault(row[0].toString(), "#888888"))
                        .build())
                .toList();
    }
}
