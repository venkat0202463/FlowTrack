package com.flowtrack.service;

import com.flowtrack.model.Project;
import com.flowtrack.model.User;
import com.flowtrack.repository.ProjectRepository;
import com.flowtrack.repository.UserRepository;
import com.flowtrack.repository.BoardColumnRepository;
import com.flowtrack.model.BoardColumn;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BoardColumnRepository columnRepository;

    @Autowired
    private com.flowtrack.repository.ActivityRepository activityRepository;

    private void logActivity(String action, String target) {
        String username = "System";
        org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder
                .getContext();
        if (context.getAuthentication() != null) {
            Object principal = context.getAuthentication().getPrincipal();
            if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            } else if (principal instanceof String) {
                username = (String) principal;
            }
        }
        activityRepository.save(new com.flowtrack.model.Activity(username, action, target));
    }

    public List<Project> getAllProjects(Long userId, String role) {
        if ("MANAGER".equalsIgnoreCase(role) || "ROLE_MANAGER".equalsIgnoreCase(role)) {
            return projectRepository.findByCreatedById(userId);
        } else {
            return projectRepository.findByTeamMembersId(userId);
        }
    }

    public Project createProject(Project project, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        project.setCreatedBy(user);

        if (project.getTeamMembers() != null && !project.getTeamMembers().isEmpty()) {
            java.util.Set<User> members = new java.util.HashSet<>();
            for (User member : project.getTeamMembers()) {
                if (member.getId() != null) {
                    userRepository.findById(member.getId()).ifPresent(members::add);
                }
            }
            project.setTeamMembers(members);
        }

        Project savedProject = projectRepository.save(project);

        // Initialize default columns
        String[] defaultColumns = { "To Do", "In Progress", "Done" };
        for (int i = 0; i < defaultColumns.length; i++) {
            BoardColumn column = new BoardColumn();
            column.setProject(savedProject);
            column.setName(defaultColumns[i]);
            column.setOrderIndex(i);
            columnRepository.save(column);
        }

        logActivity("CREATED PROJECT", savedProject.getName());
        return savedProject;
    }

    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    public Project updateProject(Long id, Project projectDetails) {
        Project project = projectRepository.findById(id).orElseThrow();
        project.setName(projectDetails.getName());
        project.setDescription(projectDetails.getDescription());
        project.setObjective(projectDetails.getObjective());
        project.setGovernance(projectDetails.getGovernance());
        project.setTeamSize(projectDetails.getTeamSize());
        project.setDeadline(projectDetails.getDeadline());
        project.setProjectKey(projectDetails.getProjectKey());
        project.setProjectType(projectDetails.getProjectType());
        project.setCategory(projectDetails.getCategory());
        project.setVisibility(projectDetails.getVisibility());
        Project saved = projectRepository.save(project);
        logActivity("UPDATED PROJECT", saved.getName());
        return saved;
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}
