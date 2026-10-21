package com.hillary.ballroom.model;


import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dancer_id", nullable = false)
    private Long dancerId;

    @Column(name = "token_hash", nullable = false)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Session() { }

    public Session(Long dancerId, String tokenHash, OffsetDateTime expiresAt) {
        this.dancerId = dancerId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getDancerId() {
        return dancerId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
