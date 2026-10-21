package com.hillary.ballroom.service;

import java.util.Base64;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class Ciphertext {

    private static final int IV_BYTES = 12;
    private static final int GCM_TAG_BYTES = 16;

    private Ciphertext() { }

    public static void validate(String iv, String ciphertext, int maxChars) {
        if (iv == null || ciphertext == null) {
            throw bad("Both iv and ciphertext are required");
        }
        if (decode(iv, "iv").length != IV_BYTES) {
            throw bad("iv must be " + IV_BYTES + " bytes");
        }
        if (ciphertext.length() > maxChars) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "That's too long to save");
        }
        if (decode(ciphertext, "ciphertext").length < GCM_TAG_BYTES) {
            throw bad("ciphertext is too short to be AES-GCM");
        }
    }

    private static byte[] decode(String value, String field) {
        try {
            return Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException e) {
            throw bad(field + " must be base64");
        }
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}