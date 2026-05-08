package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "reviews",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"product_id", "user_id"})}
)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    // Optional for now (guest reviews allowed)
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String authorName;

    private Integer rating;

    @Column(length = 1200)
    private String text;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
