package com.example.backend.controller;

import com.example.backend.DTO.CheckoutRequestDTO;
import com.example.backend.DTO.CheckoutResponseDTO;
import com.example.backend.DTO.WalletAmountDTO;
import com.example.backend.entity.Transaction;
import com.example.backend.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;


@RestController
@RequestMapping("transaction")
public class TransactionController {

    @Autowired
    TransactionService transactionService;

    @PostMapping("/wallet/deposit")
    public Transaction deposit(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody WalletAmountDTO request) {
        BigDecimal amount = request != null ? request.getAmount() : null;
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID AMOUNT");
        }
        return transactionService.Deposit(principal.getUsername(), amount);
    }

    @PostMapping("/wallet/withdraw")
    public Transaction withdraw(@AuthenticationPrincipal UserDetails principal,
                                @RequestBody WalletAmountDTO request) {
        BigDecimal amount = request != null ? request.getAmount() : null;

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID AMOUNT");
        }
        return transactionService.Withdraw(principal.getUsername(), amount);
    }

    @PostMapping("/wallet/checkout")
    public CheckoutResponseDTO checkoutWithWallet(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody CheckoutRequestDTO request
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return transactionService.checkoutWithWallet(principal.getUsername(), request);
    }

}
