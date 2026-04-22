package com.securelog.repository;

import com.securelog.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findTop10ByOrderByCreatedAtDesc();
    List<Alert> findAllByOrderByCreatedAtDesc();
    long countByIsReadFalse();

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.createdAt BETWEEN :start AND :end")
    long countCreatedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
