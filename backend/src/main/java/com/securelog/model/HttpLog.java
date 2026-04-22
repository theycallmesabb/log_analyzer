package com.securelog.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "http_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HttpLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, length = 45)
    private String ipAddress;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(nullable = false, length = 255)
    private String endpoint;

    @Column(nullable = false)
    private Integer status;

    @Column(nullable = false)
    private Integer latencyMs;

    @Column(nullable = false)
    private Boolean anomaly;

    @Column(name = "anomaly_score")
    private Double anomalyScore;

    @Column(name = "detection_algorithm", length = 100)
    private String detectionAlgorithm;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "country_code", length = 3)
    private String countryCode;

    @Column(name = "source_type", length = 50)
    @Builder.Default
    private String sourceType = "API";

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "raw_log", length = 2000)
    private String rawLog;
}
