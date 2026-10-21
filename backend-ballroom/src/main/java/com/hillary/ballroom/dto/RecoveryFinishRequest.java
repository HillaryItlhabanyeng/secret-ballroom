package com.hillary.ballroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RecoveryFinishRequest(
        @NotBlank String username,
        @NotBlank String recoveryAuthKey,
        @NotBlank String authKey,
        @NotBlank String kdfSalt,

        @NotNull @Size(min = 5, max = 11, message = "A dance must have 6 to 12 steps")
        List<Integer> rhythmMs,

        @NotBlank String wrappedKey) { }