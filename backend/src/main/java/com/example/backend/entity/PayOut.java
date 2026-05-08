package com.example.backend.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "payouts")
public class PayOut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



}
