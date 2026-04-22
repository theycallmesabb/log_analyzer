package com.securelog.controller;

import com.securelog.dto.ApiDtos.*;
import com.securelog.service.DashboardService;
import com.securelog.service.ThreatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final ThreatService threatService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/traffic")
    public ResponseEntity<List<TrafficDataPoint>> getTraffic() {
        return ResponseEntity.ok(dashboardService.getTrafficData());
    }

    @GetMapping("/attack-distribution")
    public ResponseEntity<List<AttackDistItem>> getAttackDistribution() {
        return ResponseEntity.ok(dashboardService.getAttackDistribution());
    }

    @GetMapping("/timeline")
    public ResponseEntity<List<LogTimelineItem>> getTimeline() {
        return ResponseEntity.ok(dashboardService.getLogTimeline());
    }

    @GetMapping("/alerts/recent")
    public ResponseEntity<List<AlertDto>> getRecentAlerts() {
        return ResponseEntity.ok(threatService.getRecentAlerts());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(Map.of(
            "stats",          dashboardService.getDashboardStats(),
            "recentAlerts",   threatService.getRecentAlerts(),
            "trafficData",    dashboardService.getTrafficData(),
            "attackDist",     dashboardService.getAttackDistribution(),
            "logTimeline",    dashboardService.getLogTimeline()
        ));
    }
}
