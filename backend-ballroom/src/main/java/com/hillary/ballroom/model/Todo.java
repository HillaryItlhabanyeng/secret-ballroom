package com.hillary.ballroom.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "todos")
public class Todo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dancer_id", nullable = false)
    private Long dancerId;

    @Column(nullable = false)
    private String iv;

    @Column(nullable = false)
    private String ciphertext;

    @Column(nullable = false)
    private boolean done;

    @Column(nullable = false)
    private int position;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Todo() { }

    public Todo(Long dancerId, String iv, String ciphertext, int position) {
        this.dancerId = dancerId;
        this.iv = iv;
        this.ciphertext = ciphertext;
        this.position = position;
        this.done = false;
        this.createdAt = OffsetDateTime.now();
    }

    public void replaceText(String iv, String ciphertext) {
        this.iv = iv;
        this.ciphertext = ciphertext;
    }

    public void markDone(boolean done) {
        this.done = done;
    }

    public Long getId() { return id; }
    public Long getDancerId() { return dancerId; }
    public String getIv() { return iv; }
    public String getCiphertext() { return ciphertext; }
    public boolean isDone() { return done; }
    public int getPosition() { return position; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}