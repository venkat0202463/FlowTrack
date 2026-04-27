package com.flowtrack.repository;

import com.flowtrack.model.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
    List<BoardColumn> findByProjectIdOrderByOrderIndexAsc(Long projectId);
    BoardColumn findByNameAndProjectId(String name, Long projectId);
}
