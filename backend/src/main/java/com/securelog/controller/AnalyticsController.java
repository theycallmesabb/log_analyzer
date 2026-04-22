package com.securelog.controller;

import com.securelog.dto.ApiDtos.*;
import com.securelog.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<AnalyticsDto> getFullAnalytics() {
        return ResponseEntity.ok(analyticsService.getFullAnalytics());
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeeklyDataPoint>> getWeeklyData() {
        return ResponseEntity.ok(analyticsService.getWeeklyData());
    }

    @GetMapping("/top-ips")
    public ResponseEntity<List<TopIpItem>> getTopIPs() {
        return ResponseEntity.ok(analyticsService.getTopIPs());
    }
}
