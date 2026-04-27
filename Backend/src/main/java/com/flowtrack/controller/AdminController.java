package com.flowtrack.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('MANAGER')")
public class AdminController {

    private Map<String, String> emailConfig = new HashMap<>() {
        {
            put("host", "smtp.gmail.com");
            put("port", "587");
            put("username", "testadmin@xevyte.com");
            put("fromEmail", "testadmin@xevyte.com");
        }
    };

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(emailConfig);
    }

    @PostMapping("/config")
    public ResponseEntity<?> updateConfig(@RequestBody Map<String, String> newConfig) {
        this.emailConfig.putAll(newConfig);
        return ResponseEntity.ok(Map.of("message", "Configuration synced successfully."));
    }
}
