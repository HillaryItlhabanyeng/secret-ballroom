package com.hillary.ballroom.service;

import com.hillary.ballroom.dto.DancerResponse;
import com.hillary.ballroom.dto.RecoverySaltResponse;
import com.hillary.ballroom.dto.RegisterRequest;
import com.hillary.ballroom.dto.SaltResponse;
import com.hillary.ballroom.model.Dancer;
import com.hillary.ballroom.repository.DancerRepository;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DancerService {

    private final DancerRepository dancers;
    private final PasswordEncoder encoder;
    private final String pepper;

    public DancerService(DancerRepository dancers, PasswordEncoder encoder,
                         @Value("${ballroom.pepper}") String pepper) {
        this.dancers = dancers;
        this.encoder = encoder;
        this.pepper = pepper;
    }

    @Transactional
    public DancerResponse register(RegisterRequest req) {
        String username = req.username().toLowerCase(Locale.ROOT);
        if (dancers.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That name is already taken");
        }

        Inputs.requireBase64(req.authKey(), Inputs.KEY_BYTES, "authKey");
        Inputs.requireBase64(req.kdfSalt(), Inputs.SALT_BYTES, "kdfSalt");
        Inputs.requireBase64(req.wrappedKey(), Inputs.WRAPPED_BYTES, "wrappedKey");
        Inputs.requireBase64(req.recoverySalt(), Inputs.SALT_BYTES, "recoverySalt");
        Inputs.requireBase64(req.recoveryAuthKey(), Inputs.KEY_BYTES, "recoveryAuthKey");
        Inputs.requireBase64(req.recoveryWrappedKey(), Inputs.WRAPPED_BYTES, "recoveryWrappedKey");
        int[] rhythm = Inputs.rhythm(req.rhythmMs());

        try {
            Dancer saved = dancers.saveAndFlush(new Dancer(
                    username,
                    encoder.encode(req.authKey()),
                    req.kdfSalt(),
                    rhythm,
                    req.wrappedKey(),
                    req.recoverySalt(),
                    encoder.encode(req.recoveryAuthKey()),
                    req.recoveryWrappedKey()));
            return new DancerResponse(saved.getId(), saved.getUsername());
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That name is already taken");
        }
    }

    // Unknown names get fake but consistent salts, so nobody can check which names exist
    public SaltResponse saltFor(String rawUsername) {
        String username = rawUsername.toLowerCase(Locale.ROOT);
        return dancers.findByUsername(username)
                .map(d -> new SaltResponse(d.getKdfSalt()))
                .orElseGet(() -> new SaltResponse(fakeSalt("dance:" + username)));
    }

    public RecoverySaltResponse recoverySaltFor(String rawUsername) {
        String username = rawUsername.toLowerCase(Locale.ROOT);
        return dancers.findByUsername(username)
                .map(d -> new RecoverySaltResponse(d.getRecoverySalt()))
                .orElseGet(() -> new RecoverySaltResponse(fakeSalt("recovery:" + username)));
    }

    private String fakeSalt(String label) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(pepper.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(label.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(Arrays.copyOf(digest, Inputs.SALT_BYTES));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}