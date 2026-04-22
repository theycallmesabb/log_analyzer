package com.securelog.service;

import com.securelog.model.HttpLog;
import com.securelog.model.LogSource;
import com.securelog.repository.LogSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

/**
 * Simulates realistic live HTTP traffic every 5 seconds.
 * Distributes logs across ALL active sources — powers Live Feed
 * and keeps every source's lastSeen / counters up to date.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LogSimulatorService {

    private final LogIngestionService    logIngestionService;
    private final LogSourceRepository    sourceRepo;

    private static final Random RNG = new Random();

    private static final String[] IPS = {
        "192.168.1.45","45.22.11.9","112.55.33.2","88.14.22.1",
        "172.16.254.1","10.0.0.55","203.0.113.42","198.51.100.7",
        "91.108.4.11","77.88.55.60","185.220.101.42","194.165.16.12"
    };
    private static final String[] ENDPOINTS = {
        "/api/users/auth","/api/data","/admin/settings","/login",
        "/api/orders","/health","/dashboard","/api/payments",
        "/api/v2/users","/static/js/app.js","/api/products","/api/search"
    };
    private static final String[] METHODS  = {"GET","GET","GET","GET","POST","POST","PUT","DELETE","PATCH"};
    private static final int[]    STATUSES = {200,200,200,200,201,401,403,404,500,200,200};

    @Scheduled(fixedDelay = 5000)
    public void simulateLiveTraffic() {
        // Get all active sources — distribute traffic across them
        List<LogSource> active = sourceRepo.findAll().stream()
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .toList();
        if (active.isEmpty()) return;

        int count = 1 + RNG.nextInt(3);
        for (int i = 0; i < count; i++) {
            try {
                // Pick a source weighted by position (nginx gets slightly more as main server)
                LogSource src = active.get(RNG.nextInt(active.size()));

                HttpLog entry = HttpLog.builder()
                        .timestamp(LocalDateTime.now())
                        .ipAddress(IPS[RNG.nextInt(IPS.length)])
                        .method(METHODS[RNG.nextInt(METHODS.length)])
                        .endpoint(ENDPOINTS[RNG.nextInt(ENDPOINTS.length)])
                        .status(STATUSES[RNG.nextInt(STATUSES.length)])
                        .latencyMs(40 + RNG.nextInt(500))
                        .anomaly(false)
                        .anomalyScore(0.0)
                        .detectionAlgorithm("None")
                        .sourceType(src.getType())
                        .sourceId(src.getId())
                        .build();

                logIngestionService.ingestRaw(entry);
            } catch (Exception e) {
                log.debug("Simulator tick error: {}", e.getMessage());
            }
        }
    }
}
