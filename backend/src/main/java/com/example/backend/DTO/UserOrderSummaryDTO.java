package com.example.backend.DTO;

import com.example.backend.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class UserOrderSummaryDTO {

    @Data
    @AllArgsConstructor
    public static class Item {
        private Long productId;
        private String productName;
        private String imagePath;
        private Integer quantity;
        private BigDecimal price;
    }

    private Long orderId;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private String shippingCity;
    private String shippingCountry;
    private List<Item> items;
}
