package com.hillary.ballroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RegisterRequest(
        @NotBlank
        @Pattern(regexp = "^[A-Za-z0-9_]{3,30}$", message = "3 to 30 letters, numbers or underscores")
        String username,

        @NotBlank String authKey,
        @NotBlank String kdfSalt,

        @NotNull @Size(min = 5, max = 11, message = "A dance must have 6 to 12 steps")
        List<Integer> rhythmMs,

        @NotBlank String wrappedKey,
        @NotBlank String recoverySalt,
        @NotBlank String recoveryAuthKey,
        @NotBlank String recoveryWrappedKey) { }