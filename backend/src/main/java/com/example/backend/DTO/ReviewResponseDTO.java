package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReviewResponseDTO {
    private Long id;
    private String authorName;
    private Integer rating;
    private String text;
    private String createdAt; // ISO string for easy frontend use
}

