package com.securelog.config;

import com.securelog.ml.MlEnsembleService;
import com.securelog.model.*;
import com.securelog.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final HttpLogRepository logRepo;
    private final ThreatRepository threatRepo;
    private final AlertRepository alertRepo;
    private final UserRepository userRepo;
    private final LogSourceRepository sourceRepo;
    private final MlEnsembleService mlEnsemble;
    private final PasswordEncoder passwordEncoder;

    private static final Random RNG = new Random(1337L);

    private static final String[] IPS = {
        "192.168.1.45","45.22.11.9","112.55.33.2","88.14.22.1",
        "172.16.254.1","10.0.0.55","203.0.113.42","198.51.100.7",
        "91.108.4.11","77.88.55.60"
    };
    private static final String[] ENDPOINTS = {
        "/api/users/auth","/api/data","/admin/settings","/login",
        "/api/orders","/health","/dashboard","/api/payments",
        "/api/v2/users","/static/js/app.js"
    };
    private static final String[] METHODS_W = {
        "GET","GET","GET","GET","GET","POST","POST","POST","PUT","DELETE","DELETE","PATCH"
    };
    private static final int[] STATUSES_W = {
        200,200,200,200,201,201,200,401,403,404,500,200
    };

    @Override
    public void run(String... args) {
        log.info("Seeding database...");
        seedUsers();
        seedLogSources();
        seedLogs();
        seedThreats();
        seedAlerts();
        log.info("Seeded: {} users, {} sources, {} logs, {} threats, {} alerts",
                userRepo.count(), sourceRepo.count(), logRepo.count(), threatRepo.count(), alertRepo.count());
    }

    private void seedUsers() {
        if (!userRepo.existsByEmail("admin@securelog.io")) {
            userRepo.save(User.builder()
                    .email("admin@securelog.io")
                    .fullName("Admin User")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        if (!userRepo.existsByEmail("analyst@securelog.io")) {
            userRepo.save(User.builder()
                    .email("analyst@securelog.io")
                    .fullName("Security Analyst")
                    .password(passwordEncoder.encode("analyst123"))
                    .role("ANALYST")
                    .createdAt(LocalDateTime.now())
                    .build());
        }
    }

    private void seedLogSources() {
        // Start stats at 0 — they get updated in real-time as seedLogs() runs ML on each entry
        List<LogSource> sources = List.of(
            LogSource.builder().name("Nginx Web Server").type("NGINX")
                .description("Main production nginx reverse proxy").host("10.0.0.1").port(80)
                .status("ACTIVE").totalLogsReceived(0L).anomaliesDetected(0L)
                .lastSeen(LocalDateTime.now()).createdAt(LocalDateTime.now().minusDays(30)).build(),
            LogSource.builder().name("Apache App Server").type("APACHE")
                .description("Backend Apache serving REST APIs").host("10.0.0.2").port(8080)
                .status("ACTIVE").totalLogsReceived(0L).anomaliesDetected(0L)
                .lastSeen(LocalDateTime.now()).createdAt(LocalDateTime.now().minusDays(25)).build(),
            LogSource.builder().name("Auth Service Agent").type("AGENT")
                .description("SecureLog agent on authentication service").host("10.0.0.3").port(null)
                .status("ACTIVE").totalLogsReceived(0L).anomaliesDetected(0L)
                .lastSeen(LocalDateTime.now()).createdAt(LocalDateTime.now().minusDays(10)).build(),
            LogSource.builder().name("Syslog Collector").type("SYSLOG")
                .description("System-level syslog aggregator").host("10.0.0.10").port(514)
                .status("ACTIVE").totalLogsReceived(0L).anomaliesDetected(0L)
                .lastSeen(LocalDateTime.now()).createdAt(LocalDateTime.now().minusDays(15)).build(),
            LogSource.builder().name("Windows Event Log").type("WINDOWS_EVENT")
                .description("Windows Server event collector").host("192.168.1.100").port(null)
                .status("INACTIVE").totalLogsReceived(0L).anomaliesDetected(0L)
                .lastSeen(LocalDateTime.now().minusHours(3)).createdAt(LocalDateTime.now().minusDays(5)).build()
        );
        sourceRepo.saveAll(sources);
    }

    private void seedLogs() {
        LocalDateTime now = LocalDateTime.now();
        // Only seed to ACTIVE sources so counters reflect real distribution
        List<LogSource> activeSources = sourceRepo.findAll().stream()
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .toList();
        if (activeSources.isEmpty()) return;

        // Distribute 200 seed logs evenly across all active sources
        for (int i = 0; i < 200; i++) {
            String method  = METHODS_W[RNG.nextInt(METHODS_W.length)];
            int    status  = STATUSES_W[RNG.nextInt(STATUSES_W.length)];
            String ip      = IPS[RNG.nextInt(IPS.length)];
            String ep      = ENDPOINTS[RNG.nextInt(ENDPOINTS.length)];
            int    latency = 45 + RNG.nextInt(476);

            // Round-robin across active sources for balanced distribution
            LogSource src = activeSources.get(i % activeSources.size());

            HttpLog httpLog = HttpLog.builder()
                    .timestamp(now.minusMinutes(i * 4L + RNG.nextInt(4)))
                    .ipAddress(ip).method(method).endpoint(ep)
                    .status(status).latencyMs(latency)
                    .anomaly(false).anomalyScore(0.0).detectionAlgorithm("None")
                    .sourceType(src.getType())
                    .sourceId(src.getId())
                    .build();

            MlEnsembleService.EnsembleResult r = mlEnsemble.analyze(httpLog);
            httpLog.setAnomalyScore(r.score());
            httpLog.setAnomaly(r.isAnomaly());
            httpLog.setDetectionAlgorithm(r.topAlgorithm());

            HttpLog saved = logRepo.save(httpLog);

            // Update source stats live so the Log Sources page shows real counts
            src.setTotalLogsReceived(src.getTotalLogsReceived() + 1);
            if (Boolean.TRUE.equals(saved.getAnomaly())) {
                src.setAnomaliesDetected(src.getAnomaliesDetected() + 1);
            }
            src.setLastSeen(saved.getTimestamp());
            sourceRepo.save(src);
        }
    }

    private void seedThreats() {
        LocalDateTime now = LocalDateTime.now();
        List<Threat> threats = List.of(
            Threat.builder().type("SQL Injection").severity("critical")
                .ip("45.22.11.9").target("/api/users/auth").detectedAt(now.minusMinutes(15))
                .status("Blocked").description("Malicious SQL payload detected in request body. Pattern: UNION SELECT injection.")
                .anomalyScore(0.97).detectionAlgorithm("RuleBased").mlConfidence(0.97).build(),
            Threat.builder().type("Brute Force").severity("high")
                .ip("192.168.1.45").target("/login").detectedAt(now.minusMinutes(45))
                .status("Blocked").description("47 consecutive failed login attempts from single IP within 3 minutes.")
                .anomalyScore(0.89).detectionAlgorithm("ZScore").mlConfidence(0.89).build(),
            Threat.builder().type("Endpoint Scanning").severity("medium")
                .ip("112.55.33.2").target("Multiple").detectedAt(now.minusHours(1))
                .status("Monitored").description("Sequential endpoint enumeration. 200+ unique endpoints probed.")
                .anomalyScore(0.72).detectionAlgorithm("IsolationForest").mlConfidence(0.72).build(),
            Threat.builder().type("DDoS Attempt").severity("critical")
                .ip("88.14.22.1").target("/").detectedAt(now.minusHours(2))
                .status("Mitigated").description("10,000+ requests/sec from single source.")
                .anomalyScore(0.99).detectionAlgorithm("KMeans").mlConfidence(0.99).build(),
            Threat.builder().type("XSS Attempt").severity("high")
                .ip("77.88.55.60").target("/dashboard").detectedAt(now.minusHours(3))
                .status("Blocked").description("Cross-site scripting payload in query parameters.")
                .anomalyScore(0.85).detectionAlgorithm("RuleBased").mlConfidence(0.85).build(),
            Threat.builder().type("Path Traversal").severity("medium")
                .ip("91.108.4.11").target("/api/files").detectedAt(now.minusHours(4))
                .status("Blocked").description("Directory traversal sequence (../../) detected in file path parameter.")
                .anomalyScore(0.76).detectionAlgorithm("IsolationForest").mlConfidence(0.76).build(),
            Threat.builder().type("Suspicious User Agent").severity("low")
                .ip("88.14.22.1").target("/api/data").detectedAt(now.minusHours(5))
                .status("Monitored").description("Known malicious crawler user-agent detected.")
                .anomalyScore(0.41).detectionAlgorithm("NaiveBayes").mlConfidence(0.41).build()
        );
        threatRepo.saveAll(threats);
    }

    private void seedAlerts() {
        LocalDateTime now = LocalDateTime.now();
        List<Alert> alerts = List.of(
            Alert.builder().title("Multiple Failed Logins").ip("192.168.1.45").severity("high").createdAt(now.minusMinutes(2)).isRead(false).build(),
            Alert.builder().title("SQL Injection Attempt").ip("45.22.11.9").severity("critical").createdAt(now.minusMinutes(15)).isRead(false).build(),
            Alert.builder().title("Port Scan Detected").ip("112.55.33.2").severity("medium").createdAt(now.minusHours(1)).isRead(false).build(),
            Alert.builder().title("Suspicious User Agent").ip("88.14.22.1").severity("low").createdAt(now.minusHours(2)).isRead(true).build(),
            Alert.builder().title("DDoS Pattern Detected").ip("203.0.113.42").severity("critical").createdAt(now.minusHours(3)).isRead(false).build(),
            Alert.builder().title("XSS Payload Blocked").ip("77.88.55.60").severity("high").createdAt(now.minusHours(4)).isRead(true).build(),
            Alert.builder().title("Path Traversal Blocked").ip("91.108.4.11").severity("medium").createdAt(now.minusHours(5)).isRead(true).build()
        );
        alertRepo.saveAll(alerts);
    }
}
