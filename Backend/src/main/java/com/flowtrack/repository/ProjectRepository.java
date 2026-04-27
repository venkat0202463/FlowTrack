package com.flowtrack.repository;

import com.flowtrack.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreatedById(Long userId);

    List<Project> findByTeamMembersId(Long userId);
}
