package com.hillary.ballroom.repository;

import com.hillary.ballroom.model.Dancer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DancerRepository extends JpaRepository<Dancer, Long> {

    Optional<Dancer> findByUsername(String username);

    boolean existsByUsername(String username);
}
