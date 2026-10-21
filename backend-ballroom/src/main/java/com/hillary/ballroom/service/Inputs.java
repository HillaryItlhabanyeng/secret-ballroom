package com.hillary.ballroom.service;

import java.util.Base64;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class Inputs {

    public static final int KEY_BYTES = 32;      // auth keys
    public static final int SALT_BYTES = 16;
    public static final int WRAPPED_BYTES = 40;  // a 32-byte key wrapped with AES-KW
    private static final int MIN_GAP_MS = 80;
    private static final int MAX_GAP_MS = 3000;

    private Inputs() { }

    public static void requireBase64(String value, int expectedBytes, String field) {
        try {
            if (Base64.getDecoder().decode(value).length != expectedBytes) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    field + " must be " + expectedBytes + " bytes, base64 encoded");
        }
    }

    public static int[] rhythm(List<Integer> gaps) {
        int[] rhythm = gaps.stream().mapToInt(Integer::intValue).toArray();
        for (int gap : rhythm) {
            if (gap < MIN_GAP_MS || gap > MAX_GAP_MS) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each step must come " + MIN_GAP_MS + " to " + MAX_GAP_MS + " ms after the last one");
            }
        }
        return rhythm;
    }
}