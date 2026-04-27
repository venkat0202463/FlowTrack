package com.flowtrack.controller;

import com.flowtrack.model.BoardColumn;
import com.flowtrack.model.Project;
import com.flowtrack.repository.BoardColumnRepository;
import com.flowtrack.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/columns")
public class BoardColumnController {

    @Autowired
    private BoardColumnRepository columnRepository;
    
    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    public List<BoardColumn> getColumnsByProject(@RequestParam Long projectId) {
        return columnRepository.findByProjectIdOrderByOrderIndexAsc(projectId);
    }

    @PostMapping
    public BoardColumn createColumn(@RequestBody Map<String, Object> payload) {
        Long projectId = Long.valueOf(payload.get("projectId").toString());
        String name = payload.get("name").toString();
        Integer orderIndex = Integer.valueOf(payload.get("orderIndex").toString());

        Project project = projectRepository.findById(projectId).orElseThrow();
        BoardColumn column = new BoardColumn();
        column.setProject(project);
        column.setName(name);
        column.setOrderIndex(orderIndex);
        return columnRepository.save(column);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoardColumn> updateColumn(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        BoardColumn column = columnRepository.findById(id).orElseThrow();
        if (payload.containsKey("name")) {
            column.setName(payload.get("name").toString());
        }
        if (payload.containsKey("orderIndex")) {
            column.setOrderIndex(Integer.valueOf(payload.get("orderIndex").toString()));
        }
        return ResponseEntity.ok(columnRepository.save(column));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteColumn(@PathVariable Long id) {
        columnRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
