package com.hillary.ballroom.dto;

import jakarta.validation.constraints.NotBlank;

public record EncryptedPayload(@NotBlank String iv, @NotBlank String ciphertext) { }