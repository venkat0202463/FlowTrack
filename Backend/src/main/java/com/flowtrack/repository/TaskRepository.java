package com.flowtrack.repository;

import com.flowtrack.model.Task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByOrderIndexAsc(Long projectId);
    List<Task> findBySprintIdOrderByOrderIndexAsc(Long sprintId);
    List<Task> findByAssigneeId(Long assigneeId);
    long countByColumnId(Long columnId);
}
