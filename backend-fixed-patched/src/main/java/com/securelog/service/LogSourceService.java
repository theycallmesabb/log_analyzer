package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.model.LogSource;
import com.securelog.repository.LogSourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LogSourceService {

    private final LogSourceRepository logSourceRepository;

    public List<LogSourceDto> getAllSources() {
        return logSourceRepository.findAll().stream().map(LogSourceDto::from).toList();
    }

    @Transactional
    public LogSourceDto createSource(CreateLogSourceRequest req) {
        LogSource src = LogSource.builder()
                .name(req.getName())
                .type(req.getType())
                .description(req.getDescription())
                .host(req.getHost())
                .port(req.getPort())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .totalLogsReceived(0L)
                .anomaliesDetected(0L)
                .build();
        return LogSourceDto.from(logSourceRepository.save(src));
    }

    @Transactional
    public void updateSourceStats(Long id, boolean wasAnomaly) {
        logSourceRepository.findById(id).ifPresent(src -> {
            src.setTotalLogsReceived(src.getTotalLogsReceived() + 1);
            if (wasAnomaly) src.setAnomaliesDetected(src.getAnomaliesDetected() + 1);
            src.setLastSeen(LocalDateTime.now());
            logSourceRepository.save(src);
        });
    }

    @Transactional
    public void deleteSource(Long id) {
        logSourceRepository.deleteById(id);
    }

    @Transactional
    public LogSourceDto toggleStatus(Long id) {
        LogSource src = logSourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Source not found: " + id));
        src.setStatus(src.getStatus().equals("ACTIVE") ? "INACTIVE" : "ACTIVE");
        return LogSourceDto.from(logSourceRepository.save(src));
    }
}
