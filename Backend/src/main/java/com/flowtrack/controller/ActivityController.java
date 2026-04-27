package com.flowtrack.controller;

import com.flowtrack.model.Activity;
import com.flowtrack.repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ActivityController {
    @Autowired
    ActivityRepository activityRepository;

    @GetMapping
    public List<Activity> getRecentActivities() {
        return activityRepository.findTop15ByOrderByCreatedAtDesc();
    }
}
