package com.flowtrack.service;

import com.flowtrack.model.Task;
import com.flowtrack.model.User;
import com.flowtrack.model.Project;
import com.flowtrack.repository.TaskRepository;
import com.flowtrack.repository.UserRepository;
import com.flowtrack.repository.ProjectRepository;
import com.flowtrack.model.Activity;
import com.flowtrack.repository.ActivityRepository;
import com.flowtrack.repository.SprintRepository;
import com.flowtrack.model.Sprint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TaskService {
    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private SprintRepository sprintRepository;

    private void logActivity(String action, String target) {
        String username = "System";
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        }
        activityRepository.save(new Activity(username, action, target));
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> getTasksByProjectId(Long projectId) {
        return taskRepository.findByProjectIdOrderByOrderIndexAsc(projectId);
    }

    public Task createTask(Task task, Long projectId, Long assigneeId, Long sprintId) {
        Project project = projectRepository.findById(projectId).orElseThrow();
        task.setProject(project);

        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId).orElse(null);
            task.setAssignee(assignee);
        }

        if (sprintId != null) {
            Sprint sprint = sprintRepository.findById(sprintId).orElse(null);
            task.setSprint(sprint);
        }

        if (task.getColumnId() == null) {
            task.setColumnId(1L);
        }

        if (task.getStatus() == null) {
            task.setStatus("TODO");
        }

        if (task.getEnvironment() == null) {
            task.setEnvironment("BACKLOG");
        }

        Task saved = taskRepository.save(task);
        logActivity("CREATED ISSUE", saved.getTitle());
        return saved;
    }

    public Task updateTask(Long id, Task taskDetails, Long assigneeId, Long sprintId) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setColumnId(taskDetails.getColumnId());
        task.setDueDate(taskDetails.getDueDate());
        task.setOrderIndex(taskDetails.getOrderIndex());
        task.setStatus(taskDetails.getStatus());
        task.setEnvironment(taskDetails.getEnvironment());
        task.setPriority(taskDetails.getPriority());
        task.setTags(taskDetails.getTags());
        task.setAttachments(taskDetails.getAttachments());
        task.setStoryPoints(taskDetails.getStoryPoints());
        task.setIssueType(taskDetails.getIssueType());

        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId).orElse(null);
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        if (sprintId != null) {
            Sprint sprint = sprintRepository.findById(sprintId).orElse(null);
            task.setSprint(sprint);
        } else {
            task.setSprint(null);
        }

        Task saved = taskRepository.save(task);
        logActivity("UPDATED ISSUE", saved.getTitle());
        return saved;
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id).orElseThrow();
    }

    public List<Task> getTasksBySprintId(Long sprintId) {
        return taskRepository.findBySprintIdOrderByOrderIndexAsc(sprintId);
    }

    public List<Task> getTasksByAssigneeId(Long assigneeId) {
        return taskRepository.findByAssigneeId(assigneeId);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
