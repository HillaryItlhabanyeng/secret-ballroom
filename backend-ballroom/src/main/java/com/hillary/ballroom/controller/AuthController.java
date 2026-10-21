package com.hillary.ballroom.controller;

import com.hillary.ballroom.dto.DancerResponse;
import com.hillary.ballroom.dto.LoginRequest;
import com.hillary.ballroom.dto.LoginResponse;
import com.hillary.ballroom.dto.RecoveryFinishRequest;
import com.hillary.ballroom.dto.RecoveryStartRequest;
import com.hillary.ballroom.dto.RecoveryStartResponse;
import com.hillary.ballroom.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/recover/start")
    public RecoveryStartResponse recoverStart(@Valid @RequestBody RecoveryStartRequest request) {
        return authService.recoverStart(request);
    }

    @PostMapping("/recover/finish")
    public LoginResponse recoverFinish(@Valid @RequestBody RecoveryFinishRequest request) {
        return authService.recoverFinish(request);
    }

    @GetMapping("/me")
    public DancerResponse me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return authService.me(authorization);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(authorization);
    }
}