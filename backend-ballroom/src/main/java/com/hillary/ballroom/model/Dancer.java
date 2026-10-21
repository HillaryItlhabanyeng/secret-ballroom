package com.hillary.ballroom.model;

import jakarta.persistence.*;
import java.time.Duration;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "dancers")
public class Dancer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(name = "auth_hash", nullable = false)
    private String authHash;

    @Column(name = "kdf_salt", nullable = false)
    private String kdfSalt;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "rhythm_ms", nullable = false)
    private int[] rhythmMs;

    @Column(name = "wrapped_key", nullable = false)
    private String wrappedKey;

    @Column(name = "recovery_salt", nullable = false)
    private String recoverySalt;

    @Column(name = "recovery_hash", nullable = false)
    private String recoveryHash;

    @Column(name = "recovery_wrapped_key", nullable = false)
    private String recoveryWrappedKey;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "locked_until")
    private OffsetDateTime lockedUntil;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Dancer() { }

    public Dancer(String username, String authHash, String kdfSalt, int[] rhythmMs, String wrappedKey,
                  String recoverySalt, String recoveryHash, String recoveryWrappedKey) {
        this.username = username;
        this.authHash = authHash;
        this.kdfSalt = kdfSalt;
        this.rhythmMs = rhythmMs;
        this.wrappedKey = wrappedKey;
        this.recoverySalt = recoverySalt;
        this.recoveryHash = recoveryHash;
        this.recoveryWrappedKey = recoveryWrappedKey;
        this.failedAttempts = 0;
        this.createdAt = OffsetDateTime.now();
    }


    public void resetDance(String authHash, String kdfSalt, int[] rhythmMs, String wrappedKey) {
        this.authHash = authHash;
        this.kdfSalt = kdfSalt;
        this.rhythmMs = rhythmMs;
        this.wrappedKey = wrappedKey;
        this.failedAttempts = 0;
        this.lockedUntil = null;
    }

    public boolean isLocked(OffsetDateTime now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public void recordFailedDance(OffsetDateTime now, int maxAttempts, Duration lockFor) {
        failedAttempts++;
        if (failedAttempts >= maxAttempts) {
            lockedUntil = now.plus(lockFor);
            failedAttempts = 0;
        }
    }

    public void recordSuccessfulDance() {
        failedAttempts = 0;
        lockedUntil = null;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getAuthHash() { return authHash; }
    public String getKdfSalt() { return kdfSalt; }
    public int[] getRhythmMs() { return rhythmMs; }
    public String getWrappedKey() { return wrappedKey; }
    public String getRecoverySalt() { return recoverySalt; }
    public String getRecoveryHash() { return recoveryHash; }
    public String getRecoveryWrappedKey() { return recoveryWrappedKey; }
    public int getFailedAttempts() { return failedAttempts; }
    public OffsetDateTime getLockedUntil() { return lockedUntil; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}