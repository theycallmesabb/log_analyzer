package com.securelog.repository;

import com.securelog.model.HttpLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HttpLogRepository extends JpaRepository<HttpLog, Long> {

    Page<HttpLog> findAll(Pageable pageable);

    @Query("SELECT l FROM HttpLog l WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(l.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.endpoint) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.method) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " CAST(l.status AS string) LIKE CONCAT('%', :search, '%')) AND " +
           "(:method IS NULL OR :method = '' OR :method = 'ALL' OR l.method = :method) AND " +
           "(:statusGroup IS NULL OR :statusGroup = '' OR :statusGroup = 'ALL' OR " +
           " (:statusGroup = '2' AND l.status >= 200 AND l.status < 300) OR " +
           " (:statusGroup = '4' AND l.status >= 400 AND l.status < 500) OR " +
           " (:statusGroup = '5' AND l.status >= 500 AND l.status < 600))")
    Page<HttpLog> findFiltered(@Param("search") String search,
                               @Param("method") String method,
                               @Param("statusGroup") String statusGroup,
                               Pageable pageable);

    long countByAnomalyTrue();
    long countByTimestampAfter(LocalDateTime since);

    @Query("SELECT COUNT(l) FROM HttpLog l WHERE l.timestamp BETWEEN :start AND :end")
    long countByTimestampBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT l.ipAddress, COUNT(l) as cnt FROM HttpLog l GROUP BY l.ipAddress ORDER BY cnt DESC")
    List<Object[]> findTopIPs(Pageable pageable);

    @Query("SELECT l.method, COUNT(l) as cnt FROM HttpLog l GROUP BY l.method")
    List<Object[]> countByMethod();

    @Query("SELECT l.status, COUNT(l) as cnt FROM HttpLog l GROUP BY l.status")
    List<Object[]> countByStatus();

    List<HttpLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    List<HttpLog> findByIpAddress(String ip);

    @Query("SELECT AVG(l.latencyMs) FROM HttpLog l WHERE l.timestamp > :since")
    Double avgLatencySince(@Param("since") LocalDateTime since);

    long count();
}
