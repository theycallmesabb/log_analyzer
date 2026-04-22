package com.securelog.controller;

import com.securelog.dto.ApiDtos.*;
import com.securelog.model.HttpLog;
import com.securelog.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final LogService logService;

    @GetMapping
    public ResponseEntity<PagedResponse<HttpLogDto>> getLogs(
            @RequestParam(defaultValue = "")    String search,
            @RequestParam(defaultValue = "ALL") String method,
            @RequestParam(defaultValue = "ALL") String statusGroup,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "15")  int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(logService.getLogs(search, method, statusGroup, page, size, sortBy, sortDir));
    }

    @PostMapping("/ingest")
    public ResponseEntity<HttpLogDto> ingestLog(@RequestBody HttpLog log) {
        return ResponseEntity.status(HttpStatus.CREATED).body(logService.ingestLog(log));
    }

    @GetMapping("/{id}/analyze")
    public ResponseEntity<MlAnalysisResult> analyzeLog(@PathVariable Long id) {
        return ResponseEntity.ok(logService.analyzeLog(id));
    }
}
