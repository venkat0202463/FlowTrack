package com.flowtrack.service;

import com.flowtrack.model.Sprint;
import com.flowtrack.model.Project;
import com.flowtrack.repository.SprintRepository;
import com.flowtrack.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SprintService {

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private com.flowtrack.repository.TaskRepository taskRepository;

    public List<Sprint> getSprintsByProject(Long projectId) {
        return sprintRepository.findByProjectId(projectId);
    }

    public List<Sprint> getActiveSprintsByProject(Long projectId) {
        return sprintRepository.findByProjectIdAndStatus(projectId, "ACTIVE");
    }

    public Sprint createSprint(Long projectId, Sprint sprint) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        sprint.setProject(project);
        return sprintRepository.save(sprint);
    }

    public Sprint updateSprint(Long id, Sprint sprintDetails) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
        sprint.setName(sprintDetails.getName());
        sprint.setStartDate(sprintDetails.getStartDate());
        sprint.setEndDate(sprintDetails.getEndDate());
        sprint.setStatus(sprintDetails.getStatus());

        if ("ACTIVE".equalsIgnoreCase(sprintDetails.getStatus())) {
            List<com.flowtrack.model.Task> tasks = taskRepository.findBySprintIdOrderByOrderIndexAsc(id);
            for (com.flowtrack.model.Task t : tasks) {
                if ("BACKLOG".equals(t.getEnvironment())) {
                    t.setEnvironment("SPRINT");
                    taskRepository.save(t);
                }
            }
        }

        return sprintRepository.save(sprint);
    }

    public void deleteSprint(Long id) {
        // Decouple tasks before deletion to prevent constraint violation
        List<com.flowtrack.model.Task> sprintTasks = taskRepository.findBySprintIdOrderByOrderIndexAsc(id);
        for (com.flowtrack.model.Task task : sprintTasks) {
            task.setSprint(null);
            taskRepository.save(task);
        }
        sprintRepository.deleteById(id);
    }

    public Sprint getSprintById(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
    }
}
