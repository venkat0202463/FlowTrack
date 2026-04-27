package com.flowtrack.controller;

import com.flowtrack.repository.ProjectRepository;
import com.flowtrack.repository.TaskRepository;
import com.flowtrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/summary")
    public Map<String, Object> getSummary(java.security.Principal principal) {
        String username = principal.getName();
        com.flowtrack.model.User user = userRepository.findByEmail(username).orElseThrow();
        Long userId = user.getId();
        String role = user.getRole().name();

        Map<String, Object> stats = new HashMap<>();

        if ("MANAGER".equalsIgnoreCase(role)) {
            // Managers see stats for projects they created
            long projectsCount = projectRepository.findByCreatedById(userId).size();
            stats.put("activeProjects", projectsCount);

            long totalTasks = taskRepository.findAll().stream()
                    .filter(t -> t.getProject() != null && t.getProject().getCreatedBy() != null
                            && t.getProject().getCreatedBy().getId().equals(userId))
                    .count();
            stats.put("totalTasks", totalTasks);

            long completedTasks = taskRepository.findAll().stream()
                    .filter(t -> t.getProject() != null && t.getProject().getCreatedBy() != null
                            && t.getProject().getCreatedBy().getId().equals(userId))
                    .filter(t -> "DONE".equalsIgnoreCase(t.getStatus()))
                    .count();
            stats.put("tasksCompleted", completedTasks);

            // Distinct team members across all manager's projects
            long teamCount = projectRepository.findByCreatedById(userId).stream()
                    .flatMap(p -> p.getTeamMembers().stream())
                    .map(com.flowtrack.model.User::getId)
                    .distinct()
                    .count();
            stats.put("teamMembers", teamCount + 1); // +1 for the manager themselves
        } else {
            // Users see stats for projects they are members of
            long projectsCount = projectRepository.findByTeamMembersId(userId).size();
            stats.put("activeProjects", projectsCount);

            long totalTasks = taskRepository.findAll().stream()
                    .filter(t -> t.getProject() != null
                            && t.getProject().getTeamMembers().stream().anyMatch(m -> m.getId().equals(userId)))
                    .count();
            stats.put("totalTasks", totalTasks);

            long completedTasks = taskRepository.findAll().stream()
                    .filter(t -> t.getProject() != null
                            && t.getProject().getTeamMembers().stream().anyMatch(m -> m.getId().equals(userId)))
                    .filter(t -> "DONE".equalsIgnoreCase(t.getStatus()))
                    .count();
            stats.put("tasksCompleted", completedTasks);

            stats.put("teamMembers", "N/A");
        }

        // Mock activity data
        int[] activity = { 40, 70, 45, 90, 65, 80, 50, 40, 60, 35 };
        stats.put("activity", activity);

        return stats;
    }
}
