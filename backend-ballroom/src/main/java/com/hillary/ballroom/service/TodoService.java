package com.hillary.ballroom.service;

import com.hillary.ballroom.dto.EncryptedPayload;
import com.hillary.ballroom.dto.TodoDto;
import com.hillary.ballroom.dto.TodoUpdate;
import com.hillary.ballroom.model.Todo;
import com.hillary.ballroom.repository.TodoRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TodoService {

    private static final int MAX_TODO_CHARS = 4_000;

    private final TodoRepository todos;

    public TodoService(TodoRepository todos) {
        this.todos = todos;
    }

    @Transactional(readOnly = true)
    public List<TodoDto> list(Long dancerId) {
        return todos.findByDancerIdOrderByPositionAscIdAsc(dancerId).stream().map(TodoDto::from).toList();
    }

    @Transactional
    public TodoDto create(Long dancerId, EncryptedPayload payload) {
        Ciphertext.validate(payload.iv(), payload.ciphertext(), MAX_TODO_CHARS);
        int nextPosition = todos.maxPosition(dancerId) + 1;
        return TodoDto.from(todos.save(new Todo(dancerId, payload.iv(), payload.ciphertext(), nextPosition)));
    }

    @Transactional
    public TodoDto update(Long dancerId, Long id, TodoUpdate update) {
        Todo todo = findOwned(dancerId, id);

        if (update.iv() != null || update.ciphertext() != null) {
            Ciphertext.validate(update.iv(), update.ciphertext(), MAX_TODO_CHARS);
            todo.replaceText(update.iv(), update.ciphertext());
        }
        if (update.done() != null) {
            todo.markDone(update.done());
        }
        return TodoDto.from(todo);
    }

    @Transactional
    public void delete(Long dancerId, Long id) {
        todos.delete(findOwned(dancerId, id));
    }

    private Todo findOwned(Long dancerId, Long id) {
        return todos.findByIdAndDancerId(id, dancerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "To-do not found"));
    }
}