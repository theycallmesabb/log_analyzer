package com.securelog.service;

import com.securelog.dto.ApiDtos.*;
import com.securelog.model.User;
import com.securelog.repository.UserRepository;
import com.securelog.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered: " + req.getEmail());
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
        User user = User.builder()
                .email(req.getEmail().toLowerCase().trim())
                .fullName(req.getFullName())
                .password(passwordEncoder.encode(req.getPassword()))
                .role("ANALYST")
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        log.info("Registered new user: {}", user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .message("Account created successfully")
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        if (!user.getActive()) {
            throw new RuntimeException("Account has been deactivated");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        log.info("User logged in: {}", user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .message("Login successful")
                .build();
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
