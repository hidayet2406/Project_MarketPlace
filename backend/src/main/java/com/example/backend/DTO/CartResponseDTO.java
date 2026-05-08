package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class CartResponseDTO {

    @Data
    @AllArgsConstructor
    public static class Item {
        private Long productId;
        private String name;
        private BigDecimal price;
        private String imagePath;
        private Integer quantity;
        private BigDecimal lineTotal;
    }

    private List<Item> items;
    private Integer totalQuantity;
    private BigDecimal totalAmount;
}

