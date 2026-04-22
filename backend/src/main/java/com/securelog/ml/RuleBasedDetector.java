package com.securelog.ml;

import com.securelog.model.HttpLog;
import org.springframework.stereotype.Component;

/**
 * Algorithm 1: Rule-Based Heuristic Detector
 *
 * Expert rules for known attack patterns. This detector should DOMINATE
 * for obvious attacks: SQLi, XSS, path traversal, brute force, 5xx errors.
 * Scores are intentionally high so RuleBased wins weighted attribution.
 */
@Component
public class RuleBasedDetector implements AnomalyDetector {

    private static final String[] SQLI_PATTERNS = {
        "union select", "union+select", "union%20select",
        "' or '1'='1", "' or 1=1", "drop table", "insert into",
        "select * from", "select username", "select password",
        "; drop", "1=1--", "' --", "xp_cmdshell", "information_schema"
    };

    private static final String[] XSS_PATTERNS = {
        "<script", "</script>", "javascript:", "onerror=", "onload=",
        "alert(", "document.cookie", "eval(", "<img src=", "svg/onload"
    };

    private static final String[] TRAVERSAL_PATTERNS = {
        "../", "..\\", "%2e%2e/", "%2e%2e\\", "....//", "..;/",
        "etc/passwd", "etc/shadow", "/proc/self", "win/system32"
    };

    private static final String[] SCANNER_PATTERNS = {
        "sqlmap", "nikto", "nmap", "masscan", "burpsuite",
        "zgrab", "nuclei", "dirbuster", "gobuster", "wfuzz"
    };

    private static final String[] SENSITIVE_PATHS = {
        "/admin", "/wp-admin", "/phpmyadmin", "/.env",
        "/config", "/backup", "/.git", "/actuator/env",
        "/api/users/auth", "/api/payments"
    };

    @Override
    public String getName() { return "RuleBased"; }

    @Override
    public double score(HttpLog log) {
        double score   = 0.0;
        String method  = log.getMethod()   != null ? log.getMethod().toUpperCase()  : "";
        String ep      = log.getEndpoint() != null ? log.getEndpoint().toLowerCase() : "";
        String ua      = log.getUserAgent()!= null ? log.getUserAgent().toLowerCase() : "";
        Integer status = log.getStatus();
        Integer lat    = log.getLatencyMs();

        // ── Critical: injection attacks → score 0.90–1.0 ────────────────────
        for (String p : SQLI_PATTERNS) {
            if (ep.contains(p)) { score = Math.max(score, 0.92); break; }
        }
        for (String p : XSS_PATTERNS) {
            if (ep.contains(p)) { score = Math.max(score, 0.91); break; }
        }
        for (String p : TRAVERSAL_PATTERNS) {
            if (ep.contains(p)) { score = Math.max(score, 0.95); break; }
        }

        // ── Critical: known scanner user-agents ────────────────────────────
        for (String p : SCANNER_PATTERNS) {
            if (ua.contains(p)) { score = Math.max(score, 0.88); break; }
        }

        // ── High: 5xx server errors ─────────────────────────────────────────
        if (status != null && status >= 500) score = Math.max(score, 0.72);

        // ── High: auth failures ─────────────────────────────────────────────
        if (status != null && status == 401) score = Math.max(score, 0.60);
        if (status != null && status == 401 && ep.contains("login")) score = Math.max(score, 0.75);
        if (status != null && status == 403) score = Math.max(score, 0.55);
        if (status != null && status == 403 && isSensitivePath(ep)) score = Math.max(score, 0.70);

        // ── High: sensitive path probing ────────────────────────────────────
        if (isSensitivePath(ep) && status != null && status == 404) score = Math.max(score, 0.65);
        if (ep.startsWith("/admin") || ep.startsWith("/wp-admin"))   score = Math.max(score, 0.60);
        if (ep.startsWith("/.env") || ep.startsWith("/.git"))        score = Math.max(score, 0.82);

        // ── Medium: risky HTTP methods ──────────────────────────────────────
        if ("DELETE".equals(method)) score = Math.max(score, 0.45);
        if ("DELETE".equals(method) && isSensitivePath(ep)) score = Math.max(score, 0.80);
        if ("PATCH".equals(method))  score = Math.max(score, 0.25);

        // ── Medium: POST to admin ────────────────────────────────────────────
        if ("POST".equals(method) && ep.startsWith("/admin")) score = Math.max(score, 0.70);

        // ── Low: high latency additive ──────────────────────────────────────
        // Only adds on top of existing signal — doesn't create false positives
        if (score > 0.0 && lat != null) {
            if (lat > 1000) score = Math.min(score + 0.10, 1.0);
            else if (lat > 500) score = Math.min(score + 0.05, 1.0);
        }

        return Math.min(score, 1.0);
    }

    private boolean isSensitivePath(String ep) {
        for (String s : SENSITIVE_PATHS) {
            if (ep.startsWith(s)) return true;
        }
        return false;
    }

    @Override public double threshold() { return 0.35; }
}
