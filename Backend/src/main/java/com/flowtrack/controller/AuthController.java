package com.flowtrack.controller;

import com.flowtrack.dto.JwtResponse;
import com.flowtrack.dto.LoginRequest;
import com.flowtrack.dto.SignupRequest;
import com.flowtrack.model.Role;
import com.flowtrack.model.User;
import com.flowtrack.repository.UserRepository;
import com.flowtrack.security.JwtUtils;
import com.flowtrack.security.LoginAttemptService;
import com.flowtrack.security.UserDetailsImpl;
import com.flowtrack.repository.ProjectRepository;
import com.flowtrack.repository.TaskRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    TaskRepository taskRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    org.springframework.mail.javamail.JavaMailSender mailSender;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    LoginAttemptService loginAttemptService;

    @Autowired
    jakarta.servlet.http.HttpServletRequest request;

    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final int LOCKOUT_DURATION_MINUTES = 15;
    private static final String PASSWORD_PATTERN = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        java.util.Random rnd = new java.util.Random();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++)
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }

    private String getClientIP() {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null)
            return request.getRemoteAddr();
        return xfHeader.split(",")[0];
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        String ip = getClientIP();
        if (loginAttemptService.isBlocked(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Too many login attempts from this IP. Please try again after 1 minute."));
        }

        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getLockoutExpiry() != null && user.getLockoutExpiry().isAfter(LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.LOCKED)
                        .body(Map.of("message",
                                "Account is temporarily locked due to 3 failed attempts. Please try again later."));
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(userDetails);

            // Reset failed attempts on success
            loginAttemptService.loginSucceeded(ip);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setFailedLoginAttempts(0);
                user.setLockoutExpiry(null);
                userRepository.save(user);
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .body(new JwtResponse("",
                            userDetails.getId(),
                            userDetails.getName(),
                            userDetails.getEmail(),
                            userDetails.getRole(),
                            userOpt.get().isPasswordResetRequired()));
        } catch (BadCredentialsException e) {
            loginAttemptService.loginFailed(ip);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                int attempts = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(attempts);

                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    user.setLockoutExpiry(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
                    userRepository.save(user);
                    return ResponseEntity.status(HttpStatus.LOCKED)
                            .body(Map.of("message", "Account locked due to 3 failed attempts."));
                }
                userRepository.save(user);
            }
            // Guideline 2b: Return generic error
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        } catch (Exception e) {
            loginAttemptService.loginFailed(ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }
    }

    @GetMapping("/system-stats")
    public ResponseEntity<?> getSystemStats() {
        long users = userRepository.count();
        long projects = projectRepository.count();
        long deliveredTasks = 0; // Simplified for migration

        return ResponseEntity.ok(Map.of(
                "members", users,
                "projects", projects,
                "deliveredTasks", deliveredTasks));
    }

    @PostMapping("/onboard")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> onboardUser(@RequestBody SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Collaborator already exists with this email."));
        }
        if (userRepository.existsByEmpId(signupRequest.getEmpId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Collaborator already exists with this Employee ID."));
        }

        String tempPassword = generateRandomPassword();
        User user = new User();
        user.setName(signupRequest.getName());
        user.setEmail(signupRequest.getEmail());
        user.setEmpId(signupRequest.getEmpId());
        user.setRole(Role.valueOf(signupRequest.getRole()));
        user.setPassword(encoder.encode(tempPassword));
        user.setPasswordResetRequired(true);
        userRepository.save(user);

        // Refined Onboarding Sequence with FlowTrack Branding
        try {
            jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    mimeMessage, "utf-8");

            String htmlMsg = " <div style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #172B4D; max-width: 600px; border: 2px solid #0052CC; border-radius: 16px; padding: 32px; margin: 20px auto; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>"
                    + "<h2 style='color: #0052CC; margin-top: 0;'>Welcome to FlowTrack!</h2>"
                    + "<p>Dear <strong>" + user.getName() + "</strong>,</p>"
                    + "<p>Congratulations and welcome to <strong>FlowTrack</strong>! We're excited to have you onboard.</p>"
                    + "<p>Your onboarding process has been successfully completed. Below are your credentials to access the <strong>FlowTrack Project Management Portal</strong>:</p>"
                    + "<div style='background: #F4F5F7; padding: 24px; border-left: 4px solid #0052CC; border-radius: 8px; margin: 24px 0;'>"
                    + "<p style='margin: 8px 0; font-size: 14px;'><strong>Employee ID:</strong> <span style='color: #0052CC;'>"
                    + user.getEmpId() + "</span></p>"
                    + "<p style='margin: 8px 0; font-size: 14px;'><strong>Portal Link:</strong> <a href='http://localhost:5173/login' style='color: #0052CC; text-decoration: none; font-weight: bold;'>http://localhost:5173/login</a></p>"
                    + "<p style='margin: 8px 0; font-size: 14px;'><strong>Temporary Password:</strong> <code style='background: #EBECF0; padding: 4px 8px; border-radius: 4px; color: #BF2600; font-weight: bold;'>"
                    + tempPassword + "</code></p>"
                    + "</div>"
                    + "<p style='font-weight: bold; margin-bottom: 12px;'>👉 Next Steps:</p>"
                    + "<ol style='padding-left: 20px;'>"
                    + "<li style='margin-bottom: 8px;'>Log in to the portal using the credentials above.</li>"
                    + "<li style='margin-bottom: 8px;'>You'll be prompted to change your password for security purposes.</li>"
                    + "<li style='margin-bottom: 8px;'>Complete your remaining profile details and start managing your tasks, projects, and workflows efficiently.</li>"
                    + "</ol>"
                    + "<p style='margin-top: 24px; border-top: 1px solid #DFE1E6; pt: 16px; font-size: 13px; color: #5E6C84;'>"
                    + "If you face any login issues, please contact us at <a href='mailto:admin@xevyte.com' style='color: #0052CC;'>admin@xevyte.com</a>."
                    + "</p>"
                    + "<p style='margin-top: 16px; font-weight: bold;'>"
                    + "Best regards,<br>"
                    + "<span style='color: #0052CC;'>FlowTrack Team</span>"
                    + "</p>"
                    + "</div>";

            helper.setText(htmlMsg, true);
            helper.setTo(user.getEmail());
            helper.setSubject("FlowTrack: Your Onboarding Credentials");
            helper.setFrom("testadmin@xevyte.com");

            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Onboarding email failure: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Collaborator onboarded and credentials transmitted."));
    }

    @GetMapping("/users")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User removed successfully."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> requestData) {
        String email = requestData.get("email");
        String newPassword = requestData.get("newPassword");

        if (email == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and new password are required."));
        }

        if (!Pattern.matches(PASSWORD_PATTERN, newPassword)) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(encoder.encode(newPassword));
            user.setPasswordResetRequired(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Security key established successfully."));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> requestData) {
        String email = requestData.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            try {
                org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                message.setFrom("testadmin@xevyte.com");
                message.setTo(email);
                message.setSubject("FlowTrack Node: Decryption Key Reset");
                message.setText("Greetings Protocol,\n\n"
                        + "A decryption sequence reset was requested for your FlowTrack Enterprise Node access.\n\n"
                        + "Please use the following single-use link to establish a new security key:\n"
                        + "http://localhost:5173/reset-password\n\n"
                        + "If you did not request this sequence, disregard this transmission.\n\n"
                        + "- FlowTrack automated security node");
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Fatal SMTP error: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(
                Map.of("message", "If an account with that email exists, a decryption sequence has been transmitted."));
    }
}
