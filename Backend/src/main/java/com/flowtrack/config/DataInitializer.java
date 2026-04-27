package com.flowtrack.config;

import com.flowtrack.model.Role;
import com.flowtrack.model.User;
import com.flowtrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Optional;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "testadmin@xevyte.com";
        List<User> allUsers = userRepository.findAll();
        
        // Find all matches for this email
        List<User> adminUsers = allUsers.stream()
                .filter(u -> adminEmail.equalsIgnoreCase(u.getEmail()))
                .toList();
        
        User admin;
        if (adminUsers.isEmpty()) {
            admin = new User();
            admin.setName("Project Manager");
            admin.setEmail(adminEmail);
            admin.setEmpId("EMP-001");
            admin.setRole(Role.MANAGER);
            System.out.println("Creating new admin user: " + adminEmail);
        } else {
            // Keep the first one, delete the rest if any
            admin = adminUsers.get(0);
            if (adminUsers.size() > 1) {
                System.out.println("Found " + adminUsers.size() + " duplicate admins. Consolidating...");
                for (int i = 1; i < adminUsers.size(); i++) {
                    userRepository.delete(adminUsers.get(i));
                }
            }
            System.out.println("Updating existing admin user: " + adminEmail);
        }
        
        admin.setPassword(passwordEncoder.encode("Ankithareddy@10"));
        admin.setLockoutExpiry(null);
        admin.setFailedLoginAttempts(0);
        admin.setRole(Role.MANAGER);
        userRepository.save(admin);
        System.out.println("Admin user synchronized: " + adminEmail + " with password Ankithareddy@10");

    }
}
