package com.hillary.ballroom.repository;

import com.hillary.ballroom.model.JournalEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findByDancerIdOrderByCreatedAtDesc(Long dancerId, Pageable pageable);


    Optional<JournalEntry> findByIdAndDancerId(Long id, Long dancerId);
}