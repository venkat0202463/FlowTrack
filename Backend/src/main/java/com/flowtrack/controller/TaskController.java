package com.flowtrack.controller;

import com.flowtrack.model.Task;
import com.flowtrack.dto.TaskRequest;
import com.flowtrack.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    @Autowired
    private TaskService taskService;

    @GetMapping
    public List<Task> getAllTasks(@RequestParam(required = false) Long projectId, @RequestParam(required = false) Long sprintId, @RequestParam(required = false) Long assigneeId) {
        if (sprintId != null) {
            return taskService.getTasksBySprintId(sprintId);
        }
        if (projectId != null) {
            return taskService.getTasksByProjectId(projectId);
        }
        if (assigneeId != null) {
            return taskService.getTasksByAssigneeId(assigneeId);
        }
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PostMapping
    public Task createTask(@RequestBody TaskRequest taskRequest) {
        return taskService.createTask(taskRequest.getTask(), taskRequest.getProjectId(), taskRequest.getAssigneeId(), taskRequest.getSprintId());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody TaskRequest taskRequest) {
        return ResponseEntity.ok(taskService.updateTask(id, taskRequest.getTask(), taskRequest.getAssigneeId(), taskRequest.getSprintId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok().build();
    }
}
