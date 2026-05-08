package com.example.backend.controller;

import com.example.backend.DTO.ReviewCreateDTO;
import com.example.backend.DTO.ReviewResponseDTO;
import com.example.backend.entity.Product;
import com.example.backend.service.ProductService;
import com.example.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/product")
public class ProductController {

    @Autowired
    ProductService productService;

    @Autowired
    ReviewService reviewService;

    @PostMapping("/insertProduct/{categoryName}")
    public String insertProduct(@RequestBody Product request, @PathVariable String categoryName){
        productService.insertProduct(request,categoryName);
        return "Product Created";
    }

    @GetMapping("/getProduct/{id}")
    public Product getProduct(@PathVariable Long id){
        return productService.getProductById(id);
    }

    @GetMapping("/getProductsByCategory/{categoryName}")
    public List<Product> getProductsByCategory(@PathVariable String categoryName){
        return productService.getProductsByCategory(categoryName);
    }

    @GetMapping("/getAllProducts")
    public List<Product> getAllProducts(){
        return productService.getAllProducts();
    }

    @GetMapping("/{id}/reviews")
    public List<ReviewResponseDTO> getReviews(@PathVariable Long id){
        return reviewService.getReviewsForProduct(id);
    }

    @PostMapping("/{id}/reviews")
    public ReviewResponseDTO addReview(@PathVariable Long id, @RequestBody ReviewCreateDTO request, @AuthenticationPrincipal UserDetails principal){
        if(principal == null){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return reviewService.upsertReview(id, principal.getUsername(), request);
    }



}
