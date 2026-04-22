package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.ml.MlEnsembleService;
import com.securelog.model.HttpLog;
import com.securelog.repository.HttpLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogService {

    private final HttpLogRepository logRepository;
    private final MlEnsembleService mlEnsembleService;
    private final LogIngestionService logIngestionService;

    @Transactional(readOnly = true)
    public PagedResponse<HttpLogDto> getLogs(String search, String method, String statusGroup,
                                             int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String cleanSearch = (search == null || search.isBlank()) ? "" : search.trim();
        String cleanMethod = (method == null || method.isBlank()) ? "ALL" : method.trim();
        String cleanStatus = (statusGroup == null || statusGroup.isBlank()) ? "ALL" : statusGroup.trim();

        Page<HttpLog> logPage = logRepository.findFiltered(cleanSearch, cleanMethod, cleanStatus, pageable);

        List<HttpLogDto> content = logPage.getContent().stream()
                .map(HttpLogDto::from)
                .toList();

        return PagedResponse.<HttpLogDto>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .build();
    }

    @Transactional
    public HttpLogDto ingestLog(HttpLog logEntry) {
        return logIngestionService.ingestRaw(logEntry);
    }

    @Transactional(readOnly = true)
    public MlAnalysisResult analyzeLog(Long logId) {
        HttpLog logEntry = logRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Log not found: " + logId));
        MlEnsembleService.EnsembleResult result = mlEnsembleService.analyze(logEntry);
        return MlAnalysisResult.builder()
                .ensembleScore(result.score())
                .anomaly(result.isAnomaly())
                .topAlgorithm(result.topAlgorithm())
                .individualScores(result.individualScores())
                .build();
    }

    @Transactional(readOnly = true)
    public long countTotal()     { return logRepository.count(); }

    @Transactional(readOnly = true)
    public long countAnomalies() { return logRepository.countByAnomalyTrue(); }

    @Transactional(readOnly = true)
    public long countSince(LocalDateTime since) { return logRepository.countByTimestampAfter(since); }
}
