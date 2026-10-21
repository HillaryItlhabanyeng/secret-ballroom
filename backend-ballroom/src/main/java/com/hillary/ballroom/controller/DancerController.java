package com.hillary.ballroom.controller;

import com.hillary.ballroom.dto.DancerResponse;
import com.hillary.ballroom.dto.RecoverySaltResponse;
import com.hillary.ballroom.dto.RegisterRequest;
import com.hillary.ballroom.dto.SaltResponse;
import com.hillary.ballroom.service.DancerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dancers")
public class DancerController {

    private final DancerService dancerService;

    public DancerController(DancerService dancerService) {
        this.dancerService = dancerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DancerResponse register(@Valid @RequestBody RegisterRequest request) {
        return dancerService.register(request);
    }

    @GetMapping("/{username}/salt")
    public SaltResponse salt(@PathVariable String username) {
        return dancerService.saltFor(username);
    }

    @GetMapping("/{username}/recovery-salt")
    public RecoverySaltResponse recoverySalt(@PathVariable String username) {
        return dancerService.recoverySaltFor(username);
    }
}