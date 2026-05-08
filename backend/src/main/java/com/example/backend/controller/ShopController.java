package com.example.backend.controller;

import com.example.backend.DTO.ShopDTO;
import com.example.backend.entity.Product;
import com.example.backend.service.ProductService;
import com.example.backend.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/shop")
public class ShopController {

    @Autowired
    ShopService shopService;

    @Autowired
    ProductService productService;

    @GetMapping("/my")
    public ShopDTO getMyShop(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return shopService.getMyShop(principal.getUsername());
    }

    @GetMapping("/{slug}")
    public ShopDTO getShopBySlug(@PathVariable String slug) {
        return shopService.getShopBySlug(slug);
    }

    @PostMapping
    public ShopDTO createShop(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody ShopDTO shopDTO
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return shopService.createShop(principal.getUsername(), shopDTO);
    }

    @GetMapping("/products")
    public List<Product> getMyShopProducts(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return productService.getMyShopProducts(principal.getUsername());
    }

    @GetMapping("/{slug}/products")
    public List<Product> getProductsByShopSlug(@PathVariable String slug) {
        return productService.getProductsByShopSlug(slug);
    }

    @PostMapping("/products/{categoryName}")
    public Product createProductForMyShop(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String categoryName,
            @RequestBody Product request
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return productService.insertProductForMyShop(principal.getUsername(), request, categoryName);
    }

    @PutMapping("/products/{productId}/{categoryName}")
    public Product updateProductForMyShop(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long productId,
            @PathVariable String categoryName,
            @RequestBody Product request
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return productService.updateMyShopProduct(principal.getUsername(), productId, request, categoryName);
    }

    @PostMapping("/products/image")
    public String uploadProductImage(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam("file") MultipartFile file
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return productService.uploadProductImage(principal.getUsername(), file);
    }

    @DeleteMapping("/products/{productId}")
    public void deleteMyShopProduct(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long productId
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        productService.deleteMyShopProduct(principal.getUsername(), productId);
    }
}
