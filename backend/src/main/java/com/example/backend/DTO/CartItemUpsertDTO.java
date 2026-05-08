package com.example.backend.DTO;

import lombok.Data;

@Data
public class CartItemUpsertDTO {
    private Long productId;
    private Integer quantity;
}

