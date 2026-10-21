package com.hillary.ballroom.repository;

import com.hillary.ballroom.model.Todo;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TodoRepository extends JpaRepository<Todo, Long> {

    List<Todo> findByDancerIdOrderByPositionAscIdAsc(Long dancerId);

    Optional<Todo> findByIdAndDancerId(Long id, Long dancerId);

    @Query("SELECT COALESCE(MAX(t.position), -1) FROM Todo t WHERE t.dancerId = :dancerId")
    int maxPosition(@Param("dancerId") Long dancerId);
}