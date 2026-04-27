package com.flowtrack.repository;

import com.flowtrack.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findTop15ByOrderByCreatedAtDesc();
}
