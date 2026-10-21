package com.hillary.ballroom.dto;

import com.hillary.ballroom.model.Todo;
import java.time.OffsetDateTime;

public record TodoDto(Long id, String iv, String ciphertext, boolean done, int position, OffsetDateTime createdAt) {

    public static TodoDto from(Todo t) {
        return new TodoDto(t.getId(), t.getIv(), t.getCiphertext(), t.isDone(), t.getPosition(), t.getCreatedAt());
    }
}