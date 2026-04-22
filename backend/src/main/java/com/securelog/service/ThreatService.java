package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.model.Alert;
import com.securelog.model.Threat;
import com.securelog.repository.AlertRepository;
import com.securelog.repository.ThreatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThreatService {

    private final ThreatRepository threatRepository;
    private final AlertRepository alertRepository;

    @Transactional(readOnly = true)
    public List<ThreatDto> getAllThreats(String severityFilter) {
        List<Threat> threats;
        if (severityFilter == null || severityFilter.equalsIgnoreCase("ALL") || severityFilter.isBlank()) {
            threats = threatRepository.findAllByOrderByDetectedAtDesc();
        } else {
            threats = threatRepository.findBySeverityOrderByDetectedAtDesc(severityFilter.toLowerCase());
        }
        return threats.stream().map(ThreatDto::from).toList();
    }

    @Transactional(readOnly = true)
    public SeverityCounts getSeverityCounts() {
        return SeverityCounts.builder()
                .critical(threatRepository.countBySeverity("critical"))
                .high(threatRepository.countBySeverity("high"))
                .medium(threatRepository.countBySeverity("medium"))
                .low(threatRepository.countBySeverity("low"))
                .build();
    }

    @Transactional(readOnly = true)
    public List<AlertDto> getRecentAlerts() {
        return alertRepository.findTop10ByOrderByCreatedAtDesc()
                .stream().map(AlertDto::from).toList();
    }

    @Transactional
    public void markAlertRead(Long alertId) {
        alertRepository.findById(alertId).ifPresent(a -> {
            a.setIsRead(true);
            alertRepository.save(a);
        });
    }

    @Transactional(readOnly = true)
    public long countUnreadAlerts() {
        return alertRepository.countByIsReadFalse();
    }

    @Transactional(readOnly = true)
    public long countBlockedThreats() {
        return threatRepository.countByStatus("Blocked");
    }

    @Transactional(readOnly = true)
    public long countSuspiciousIPs() {
        return threatRepository.findAllByOrderByDetectedAtDesc()
                .stream().map(Threat::getIp).distinct().count();
    }
}
