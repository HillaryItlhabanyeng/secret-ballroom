package com.hillary.ballroom.controller;

import com.hillary.ballroom.config.AuthInterceptor;
import com.hillary.ballroom.dto.EncryptedPayload;
import com.hillary.ballroom.dto.EntryDto;
import com.hillary.ballroom.service.JournalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/entries")
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @GetMapping
    public List<EntryDto> list(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId,
                               @RequestParam(defaultValue = "50") int limit) {
        return journalService.list(dancerId, limit);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EntryDto create(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId,
                           @Valid @RequestBody EncryptedPayload payload) {
        return journalService.create(dancerId, payload);
    }

    @PatchMapping("/{id}")
    public EntryDto update(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId,
                           @PathVariable Long id,
                           @Valid @RequestBody EncryptedPayload payload) {
        return journalService.update(dancerId, id, payload);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId, @PathVariable Long id) {
        journalService.delete(dancerId, id);
    }
}