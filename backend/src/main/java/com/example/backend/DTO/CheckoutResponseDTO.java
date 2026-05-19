package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CheckoutResponseDTO {
    private Long orderId;
    private Long transactionId;
    private Integer itemCount;
    private BigDecimal subtotal;
    private BigDecimal shippingAmount;
    private BigDecimal totalAmount;
    private BigDecimal walletBalance;
}
