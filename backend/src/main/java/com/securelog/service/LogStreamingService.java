package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.model.HttpLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogStreamingService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastLog(HttpLog httpLog) {
        try {
            LiveLogEvent event = LiveLogEvent.builder()
                    .type("LOG")
                    .data(HttpLogDto.from(httpLog))
                    .timestamp(System.currentTimeMillis())
                    .build();
            messagingTemplate.convertAndSend("/topic/logs", event);
        } catch (Exception e) {
            log.warn("Failed to broadcast log: {}", e.getMessage());
        }
    }

    public void broadcastAlert(AlertDto alert) {
        try {
            LiveLogEvent event = LiveLogEvent.builder()
                    .type("ALERT")
                    .data(alert)
                    .timestamp(System.currentTimeMillis())
                    .build();
            messagingTemplate.convertAndSend("/topic/alerts", event);
        } catch (Exception e) {
            log.warn("Failed to broadcast alert: {}", e.getMessage());
        }
    }

    public void broadcastThreat(ThreatDto threat) {
        try {
            LiveLogEvent event = LiveLogEvent.builder()
                    .type("THREAT")
                    .data(threat)
                    .timestamp(System.currentTimeMillis())
                    .build();
            messagingTemplate.convertAndSend("/topic/threats", event);
        } catch (Exception e) {
            log.warn("Failed to broadcast threat: {}", e.getMessage());
        }
    }
}
