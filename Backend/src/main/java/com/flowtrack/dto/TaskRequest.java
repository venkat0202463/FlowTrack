package com.flowtrack.dto;

import com.flowtrack.model.Task;

public class TaskRequest {
    private Task task;
    private Long projectId;
    private Long assigneeId;
    private Long sprintId;

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }

    public Long getSprintId() { return sprintId; }
    public void setSprintId(Long sprintId) { this.sprintId = sprintId; }
}
