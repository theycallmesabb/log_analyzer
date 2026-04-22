package com.securelog.repository;

import com.securelog.model.LogSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogSourceRepository extends JpaRepository<LogSource, Long> {
    List<LogSource> findByStatus(String status);
    List<LogSource> findByType(String type);
}
