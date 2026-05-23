package com.example.backend.controller;

import com.example.backend.DTO.LoginDTO;
import com.example.backend.DTO.RegisterDTO;
import com.example.backend.DTO.ResetPasswordDTO;
import com.example.backend.config.JwtUtil;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    JwtUtil jwtUtil;

    @Autowired
    UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public String register(@RequestBody RegisterDTO request){
        if(request.getUsername() == null || request.getEmail() == null || request.getPassword() == null
                || request.getUsername().isBlank() || request.getEmail().isBlank() || request.getPassword().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username, email and password are required");
        }

        String username = request.getUsername().trim().toUpperCase();
        String email = request.getEmail().trim().toLowerCase();

        if(userRepository.existsByUsernameIgnoreCase(username)){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        if(userRepository.existsByEmail(email)){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        LocalDateTime now = LocalDateTime.now();

        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);
        user.setWallet(BigDecimal.valueOf(0));
        user.setEnabled(true);
        user.setEmailVerified(false);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        if(request.getRole() != null && !request.getRole().isEmpty()){
            user.setRole(request.getRole().toUpperCase());
        }
        userRepository.save(user);
        return "USER CREATED";
    }


    @PostMapping("/login")
    public String login(@RequestBody LoginDTO request){
        if (request.getUsername() == null || request.getPassword() == null
                || request.getUsername().isEmpty() || request.getPassword().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username or password cannot be empty");
        }
        try{
            String username = request.getUsername().trim();
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            username,
                            request.getPassword()
                    ));

            // Use canonical username from DB to keep token subject consistent.
            String canonical = userRepository.findByUsernameIgnoreCase(username)
                    .map(User::getUsername)
                    .orElse(username.trim().toUpperCase());

            return jwtUtil.generateToken(canonical);
        } catch (Exception e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
    }


    @PostMapping("/reset-password")
    public String resetPassword(@RequestBody ResetPasswordDTO request){
        if(request.getUsername() == null || request.getNewPassword() == null 
                || request.getUsername().isBlank() || request.getNewPassword().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and new password are required");
        }

        User user = userRepository.findByUsernameIgnoreCase(request.getUsername().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return "PASSWORD RESET SUCCESSFUL";
    }
}
