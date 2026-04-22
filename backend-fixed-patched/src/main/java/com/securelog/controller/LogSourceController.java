package com.securelog.controller;

import com.securelog.dto.ApiDtos.*;
import com.securelog.model.HttpLog;
import com.securelog.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sources")
@RequiredArgsConstructor
public class LogSourceController {

    private final LogSourceService logSourceService;
    private final LogIngestionService logIngestionService;

    @GetMapping
    public ResponseEntity<List<LogSourceDto>> getAllSources() {
        return ResponseEntity.ok(logSourceService.getAllSources());
    }

    @PostMapping
    public ResponseEntity<LogSourceDto> createSource(@RequestBody CreateLogSourceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(logSourceService.createSource(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSource(@PathVariable Long id) {
        logSourceService.deleteSource(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<LogSourceDto> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(logSourceService.toggleStatus(id));
    }

    /** Ingest a single log via API for a specific source */
    @PostMapping("/{id}/ingest")
    public ResponseEntity<HttpLogDto> ingestSingle(@PathVariable Long id,
                                                    @RequestBody HttpLog log) {
        log.setSourceId(id);
        log.setSourceType("AGENT");
        return ResponseEntity.status(HttpStatus.CREATED).body(logIngestionService.ingestRaw(log));
    }

    /** Upload a log file (nginx / apache format) */
    @PostMapping("/{id}/upload")
    public ResponseEntity<Map<String, Object>> uploadLogFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "format", defaultValue = "NGINX") String format) {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            String[] lines = content.split("\\n");
            int count = logIngestionService.ingestBulkLines(lines, format, id);
            return ResponseEntity.ok(Map.of(
                    "processed", count,
                    "total", lines.length,
                    "format", format
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** Paste raw log lines as text body */
    @PostMapping("/{id}/paste")
    public ResponseEntity<Map<String, Object>> pasteLogs(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String content = body.getOrDefault("content", "");
        String format  = body.getOrDefault("format", "NGINX");
        String[] lines = content.split("\\n");
        int count = logIngestionService.ingestBulkLines(lines, format, id);
        return ResponseEntity.ok(Map.of("processed", count, "total", lines.length));
    }
}
