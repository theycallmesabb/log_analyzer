package com.securelog.repository;

import com.securelog.model.Threat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ThreatRepository extends JpaRepository<Threat, Long> {

    List<Threat> findBySeverityOrderByDetectedAtDesc(String severity);
    List<Threat> findAllByOrderByDetectedAtDesc();
    long countBySeverity(String severity);

    @Query("SELECT t.type, COUNT(t) FROM Threat t GROUP BY t.type ORDER BY COUNT(t) DESC")
    List<Object[]> countByType();

    List<Threat> findByIp(String ip);
    List<Threat> findByDetectedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByStatus(String status);

    @Query("SELECT COUNT(t) FROM Threat t WHERE t.status = :status AND t.detectedAt BETWEEN :start AND :end")
    long countByStatusAndDetectedAtBetween(
            @Param("status") String status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
