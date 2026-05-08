package com.example.backend.controller;


import com.example.backend.DTO.VendorRequestDTO;
import com.example.backend.DTO.ShopDTO;
import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.entity.Shop;
import com.example.backend.entity.User;
import com.example.backend.entity.Vendor;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AdminCatalogService;
import com.example.backend.service.AdminUserService;
import com.example.backend.service.CategoryService;
import com.example.backend.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    CategoryService categoryService;

    @Autowired
    VendorService vendorService;

    @Autowired
    AdminUserService adminUserService;

    @Autowired
    AdminCatalogService adminCatalogService;


    @GetMapping("/findUserById/{id}")
    public User findUserById(@PathVariable Long id){
        return userRepository.findById(id).orElseThrow(()-> new RuntimeException("USER NOT FOUND"));
    }

    @GetMapping()
    public List<User> getAllUser(){
        return userRepository.findAll();
    }

    @PostMapping("/insertCategory")
    public String insertCategory(@RequestBody Category category){
        return categoryService.insertCategory(category);
    }

    @GetMapping("/getVendors")
    public List<Vendor> getVendors(){
        return vendorService.getVendors();
    }

    @PutMapping("/{id}/updateVendor")
    public VendorRequestDTO updateVendor(@PathVariable Long id, @RequestBody VendorRequestDTO vendorRequestDTO){
        return vendorService.updateVendors(id, vendorRequestDTO);
    }

    @GetMapping("/shops")
    public List<Shop> getAllShops(){
        return adminCatalogService.getAllShops();
    }

    @PutMapping("/shops/{id}/status")
    public ShopDTO updateShopStatus(@PathVariable Long id, @RequestBody ShopDTO shopDTO){
        return adminCatalogService.updateShopStatus(id, shopDTO);
    }

    @DeleteMapping("/shops/{id}")
    public void deleteShop(@PathVariable Long id){
        adminCatalogService.deleteShop(id);
    }

    @GetMapping("/products")
    public List<Product> getAllProducts(){
        return adminCatalogService.getAllProducts();
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable Long id){
        adminCatalogService.deleteProduct(id);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal
    ){
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        adminUserService.deleteUserCascade(id, principal.getUsername());
    }

}
