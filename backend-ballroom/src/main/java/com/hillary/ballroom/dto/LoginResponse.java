package com.hillary.ballroom.dto;

import java.time.OffsetDateTime;


public record LoginResponse(String token, String username, OffsetDateTime expiresAt, String wrappedKey) { }