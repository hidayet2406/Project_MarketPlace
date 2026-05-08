package com.example.backend.controller;

import com.example.backend.DTO.CartItemUpsertDTO;
import com.example.backend.DTO.CartResponseDTO;
import com.example.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    CartService cartService;

    @GetMapping
    public CartResponseDTO getCart(@AuthenticationPrincipal UserDetails principal){
        if(principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        return cartService.getCart(principal.getUsername());
    }

    @PostMapping("/items")
    public CartResponseDTO addItem(@AuthenticationPrincipal UserDetails principal, @RequestBody CartItemUpsertDTO request){
        if(principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        return cartService.addItem(principal.getUsername(), request);
    }

    @PutMapping("/items")
    public CartResponseDTO setItem(@AuthenticationPrincipal UserDetails principal, @RequestBody CartItemUpsertDTO request){
        if(principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        return cartService.setItemQuantity(principal.getUsername(), request);
    }

    @DeleteMapping("/items/{productId}")
    public CartResponseDTO removeItem(@AuthenticationPrincipal UserDetails principal, @PathVariable Long productId){
        if(principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        return cartService.removeItem(principal.getUsername(), productId);
    }
}

