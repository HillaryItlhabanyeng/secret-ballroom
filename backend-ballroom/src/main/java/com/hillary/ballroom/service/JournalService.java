package com.hillary.ballroom.service;

import com.hillary.ballroom.dto.EncryptedPayload;
import com.hillary.ballroom.dto.EntryDto;
import com.hillary.ballroom.model.JournalEntry;
import com.hillary.ballroom.repository.JournalEntryRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class JournalService {

    private static final int MAX_ENTRY_CHARS = 200_000;

    private final JournalEntryRepository entries;

    public JournalService(JournalEntryRepository entries) {
        this.entries = entries;
    }

    @Transactional(readOnly = true)
    public List<EntryDto> list(Long dancerId, int limit) {
        PageRequest page = PageRequest.of(0, Math.min(Math.max(limit, 1), 200));
        return entries.findByDancerIdOrderByCreatedAtDesc(dancerId, page).stream().map(EntryDto::from).toList();
    }

    @Transactional
    public EntryDto create(Long dancerId, EncryptedPayload payload) {
        Ciphertext.validate(payload.iv(), payload.ciphertext(), MAX_ENTRY_CHARS);
        return EntryDto.from(entries.save(new JournalEntry(dancerId, payload.iv(), payload.ciphertext())));
    }

    @Transactional
    public EntryDto update(Long dancerId, Long id, EncryptedPayload payload) {
        Ciphertext.validate(payload.iv(), payload.ciphertext(), MAX_ENTRY_CHARS);
        JournalEntry entry = findOwned(dancerId, id);
        entry.replaceContent(payload.iv(), payload.ciphertext());
        return EntryDto.from(entry);
    }

    @Transactional
    public void delete(Long dancerId, Long id) {
        entries.delete(findOwned(dancerId, id));
    }


    private JournalEntry findOwned(Long dancerId, Long id) {
        return entries.findByIdAndDancerId(id, dancerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
    }
}