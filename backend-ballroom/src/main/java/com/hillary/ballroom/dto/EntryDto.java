package com.hillary.ballroom.dto;

import com.hillary.ballroom.model.JournalEntry;
import java.time.OffsetDateTime;

public record EntryDto(Long id, String iv, String ciphertext, OffsetDateTime createdAt, OffsetDateTime updatedAt) {

    public static EntryDto from(JournalEntry e) {
        return new EntryDto(e.getId(), e.getIv(), e.getCiphertext(), e.getCreatedAt(), e.getUpdatedAt());
    }
}