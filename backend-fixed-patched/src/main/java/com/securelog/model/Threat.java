package com.securelog.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "threats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Threat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String type;

    @Column(nullable = false, length = 20)
    private String severity; // critical, high, medium, low

    @Column(nullable = false, length = 45)
    private String ip;

    @Column(nullable = false, length = 255)
    private String target;

    @Column(nullable = false)
    private LocalDateTime detectedAt;

    @Column(nullable = false, length = 50)
    private String status; // Blocked, Monitored, Mitigated

    @Column(length = 1000)
    private String description;

    @Column(name = "anomaly_score")
    private Double anomalyScore;

    @Column(name = "detection_algorithm", length = 100)
    private String detectionAlgorithm;

    @Column(name = "ml_confidence")
    private Double mlConfidence;

    @Column(name = "raw_log_id")
    private Long rawLogId;
}
