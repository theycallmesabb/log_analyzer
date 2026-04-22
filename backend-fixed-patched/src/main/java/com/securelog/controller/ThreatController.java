package com.securelog.controller;

import com.securelog.dto.ApiDtos.*;
import com.securelog.service.ThreatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/threats")
@RequiredArgsConstructor
public class ThreatController {

    private final ThreatService threatService;

    @GetMapping
    public ResponseEntity<List<ThreatDto>> getThreats(
            @RequestParam(defaultValue = "ALL") String severity) {
        return ResponseEntity.ok(threatService.getAllThreats(severity));
    }

    @GetMapping("/counts")
    public ResponseEntity<SeverityCounts> getSeverityCounts() {
        return ResponseEntity.ok(threatService.getSeverityCounts());
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<AlertDto>> getAlerts() {
        return ResponseEntity.ok(threatService.getRecentAlerts());
    }

    @PatchMapping("/alerts/{id}/read")
    public ResponseEntity<Void> markAlertRead(@PathVariable Long id) {
        threatService.markAlertRead(id);
        return ResponseEntity.ok().build();
    }
}
