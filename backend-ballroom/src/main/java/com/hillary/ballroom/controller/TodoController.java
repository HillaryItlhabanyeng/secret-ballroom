package com.hillary.ballroom.controller;

import com.hillary.ballroom.config.AuthInterceptor;
import com.hillary.ballroom.dto.EncryptedPayload;
import com.hillary.ballroom.dto.TodoDto;
import com.hillary.ballroom.dto.TodoUpdate;
import com.hillary.ballroom.service.TodoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public List<TodoDto> list(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId) {
        return todoService.list(dancerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TodoDto create(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId,
                          @Valid @RequestBody EncryptedPayload payload) {
        return todoService.create(dancerId, payload);
    }

    @PatchMapping("/{id}")
    public TodoDto update(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId,
                          @PathVariable Long id,
                          @RequestBody TodoUpdate update) {
        return todoService.update(dancerId, id, update);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestAttribute(AuthInterceptor.DANCER_ID) Long dancerId, @PathVariable Long id) {
        todoService.delete(dancerId, id);
    }
}