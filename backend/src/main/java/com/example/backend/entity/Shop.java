package com.example.backend.entity;

import com.example.backend.entity.enums.ShopStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "shops")
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String slug;

    private String description;

    @Enumerated(EnumType.STRING)
    private ShopStatus status;

    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;



}
