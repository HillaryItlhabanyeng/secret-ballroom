package com.hillary.ballroom.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dancer_id", nullable = false)
    private Long dancerId;

    @Column(nullable = false)
    private String iv;

    @Column(nullable = false)
    private String ciphertext;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected JournalEntry() { }

    public JournalEntry(Long dancerId, String iv, String ciphertext) {
        this.dancerId = dancerId;
        this.iv = iv;
        this.ciphertext = ciphertext;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public void replaceContent(String iv, String ciphertext) {
        this.iv = iv;
        this.ciphertext = ciphertext;
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Long getDancerId() { return dancerId; }
    public String getIv() { return iv; }
    public String getCiphertext() { return ciphertext; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}