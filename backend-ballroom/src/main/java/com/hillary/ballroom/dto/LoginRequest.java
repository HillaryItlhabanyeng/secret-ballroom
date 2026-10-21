package com.hillary.ballroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record LoginRequest(
        @NotBlank String username,
        @NotBlank String authKey,
        @NotNull List<Integer> rhythmMs) { }