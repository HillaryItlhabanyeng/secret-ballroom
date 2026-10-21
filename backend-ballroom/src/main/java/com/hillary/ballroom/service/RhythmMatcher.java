package com.hillary.ballroom.service;

import java.util.List;

public class RhythmMatcher {

    static final int MIN_TOLERANCE_MS = 120;
    static final double TOLERANCE_RATIO = 0.30;

    private RhythmMatcher() { }

    public static boolean matches(int[] stored, List<Integer> attempt) {
        if (attempt == null || attempt.size() != stored.length) {
            return false;
        }
        for (int i = 0; i < stored.length; i++) {
            Integer gap = attempt.get(i);
            if (gap == null) {
                return false;
            }
            double allowed = Math.max(MIN_TOLERANCE_MS, stored[i] * TOLERANCE_RATIO);
            if (Math.abs(gap - stored[i]) > allowed) {
                return false;
            }
        }
        return true;
    }
}
