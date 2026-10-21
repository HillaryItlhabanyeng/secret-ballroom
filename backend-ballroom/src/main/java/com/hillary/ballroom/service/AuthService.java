package com.hillary.ballroom.service;

import com.hillary.ballroom.dto.DancerResponse;
import com.hillary.ballroom.dto.LoginRequest;
import com.hillary.ballroom.dto.LoginResponse;
import com.hillary.ballroom.dto.RecoveryFinishRequest;
import com.hillary.ballroom.dto.RecoveryStartRequest;
import com.hillary.ballroom.dto.RecoveryStartResponse;
import com.hillary.ballroom.model.Dancer;
import com.hillary.ballroom.model.Session;
import com.hillary.ballroom.repository.DancerRepository;
import com.hillary.ballroom.repository.SessionRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_FOR = Duration.ofMinutes(5);
    private static final Duration SESSION_LENGTH = Duration.ofHours(1);
    private static final String WRONG_DANCE = "The floor didn't recognise that dance";
    private static final String WRONG_CODE = "That recovery code didn't open the ballroom";

    private final DancerRepository dancers;
    private final SessionRepository sessions;
    private final PasswordEncoder encoder;
    private final String dummyHash;
    private final SecureRandom random = new SecureRandom();

    public AuthService(DancerRepository dancers, SessionRepository sessions, PasswordEncoder encoder) {
        this.dancers = dancers;
        this.sessions = sessions;
        this.encoder = encoder;
        this.dummyHash = encoder.encode("not-a-real-dancer");
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public LoginResponse login(LoginRequest req) {
        OffsetDateTime now = OffsetDateTime.now();
        Dancer dancer = findForCheck(req.username(), req.authKey(), WRONG_DANCE, now);

        boolean stepsMatch = encoder.matches(req.authKey(), dancer.getAuthHash());
        boolean rhythmMatches = RhythmMatcher.matches(dancer.getRhythmMs(), req.rhythmMs());

        if (!stepsMatch || !rhythmMatches) {
            dancer.recordFailedDance(now, MAX_ATTEMPTS, LOCK_FOR);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, WRONG_DANCE);
        }
        dancer.recordSuccessfulDance();
        return startSession(dancer, now);
    }

    // Recovery step 1: prove you have the code, get the journal key (still wrapped) back
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public RecoveryStartResponse recoverStart(RecoveryStartRequest req) {
        Dancer dancer = verifyRecovery(req.username(), req.recoveryAuthKey(), OffsetDateTime.now());
        return new RecoveryStartResponse(dancer.getRecoveryWrappedKey());
    }

    // Recovery step 2: prove it again, and save the new dance + the journal key wrapped with it
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public LoginResponse recoverFinish(RecoveryFinishRequest req) {
        OffsetDateTime now = OffsetDateTime.now();
        Dancer dancer = verifyRecovery(req.username(), req.recoveryAuthKey(), now);

        Inputs.requireBase64(req.authKey(), Inputs.KEY_BYTES, "authKey");
        Inputs.requireBase64(req.kdfSalt(), Inputs.SALT_BYTES, "kdfSalt");
        Inputs.requireBase64(req.wrappedKey(), Inputs.WRAPPED_BYTES, "wrappedKey");
        int[] rhythm = Inputs.rhythm(req.rhythmMs());

        dancer.resetDance(encoder.encode(req.authKey()), req.kdfSalt(), rhythm, req.wrappedKey());
        sessions.deleteByDancerId(dancer.getId()); // sign out every other device
        return startSession(dancer, now);
    }

    @Transactional(readOnly = true)
    public Long authenticate(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        return sessions.findByTokenHash(sha256(token))
                .filter(s -> s.getExpiresAt().isAfter(OffsetDateTime.now()))
                .map(Session::getDancerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Your session has ended. Please dance in again."));
    }

    @Transactional(readOnly = true)
    public DancerResponse me(String authorizationHeader) {
        Long dancerId = authenticate(authorizationHeader);
        Dancer dancer = dancers.findById(dancerId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Dancer not found"));
        return new DancerResponse(dancer.getId(), dancer.getUsername());
    }

    @Transactional
    public void logout(String authorizationHeader) {
        sessions.deleteByTokenHash(sha256(extractToken(authorizationHeader)));
    }

    // ---- helpers ----

    private Dancer findForCheck(String rawUsername, String secret, String wrongMessage, OffsetDateTime now) {
        String username = rawUsername.toLowerCase(Locale.ROOT);
        Dancer dancer = dancers.findByUsername(username).orElse(null);
        if (dancer == null) {
            encoder.matches(secret, dummyHash); // same slow work, so timing reveals nothing
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, wrongMessage);
        }
        if (dancer.isLocked(now)) {
            throw new ResponseStatusException(HttpStatus.LOCKED,
                    "Too many wrong tries. The ballroom is closed for a few minutes.");
        }
        return dancer;
    }

    private Dancer verifyRecovery(String rawUsername, String recoveryAuthKey, OffsetDateTime now) {
        Dancer dancer = findForCheck(rawUsername, recoveryAuthKey, WRONG_CODE, now);
        if (!encoder.matches(recoveryAuthKey, dancer.getRecoveryHash())) {
            dancer.recordFailedDance(now, MAX_ATTEMPTS, LOCK_FOR); // wrong codes count toward the lockout too
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, WRONG_CODE);
        }
        dancer.recordSuccessfulDance();
        return dancer;
    }

    private LoginResponse startSession(Dancer dancer, OffsetDateTime now) {
        String token = newToken();
        OffsetDateTime expiresAt = now.plus(SESSION_LENGTH);
        sessions.save(new Session(dancer.getId(), sha256(token), expiresAt));
        return new LoginResponse(token, dancer.getUsername(), expiresAt, dancer.getWrappedKey());
    }

    private String extractToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please dance in first");
        }
        return header.substring(7);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}