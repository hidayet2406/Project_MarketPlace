package com.example.backend.DTO;

import lombok.Data;

@Data
public class ResetPasswordDTO {
    private String username;
    private String newPassword;
}
