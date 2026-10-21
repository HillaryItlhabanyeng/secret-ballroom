
package com.hillary.ballroom.dto;

import jakarta.validation.constraints.NotBlank;

public record RecoveryStartRequest(@NotBlank String username, @NotBlank String recoveryAuthKey) { }