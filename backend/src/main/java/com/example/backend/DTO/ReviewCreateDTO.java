package com.example.backend.DTO;

import lombok.Data;

@Data
public class ReviewCreateDTO {
    private String name;
    private Integer rating;
    private String text;
}

