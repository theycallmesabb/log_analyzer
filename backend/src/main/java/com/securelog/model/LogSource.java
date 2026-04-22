package com.securelog.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_sources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String type; // SYSLOG, NGINX, APACHE, AGENT, API, FILE_UPLOAD, WINDOWS_EVENT

    @Column(length = 200)
    private String description;

    @Column(length = 45)
    private String host;

    @Column
    private Integer port;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, ERROR

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime lastSeen;

    @Column
    @Builder.Default
    private Long totalLogsReceived = 0L;

    @Column
    @Builder.Default
    private Long anomaliesDetected = 0L;
}
