package com.hillary.ballroom.repository;

import com.hillary.ballroom.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteByTokenHash(String tokenHash);

    void deleteByDancerId(Long dancerId);
}
