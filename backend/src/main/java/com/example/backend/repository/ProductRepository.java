package com.example.backend.repository;

import com.example.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByCategory_Name(String categoryName);
    List<Product> findAllByShop_Vendor_User_Username(String username);
    List<Product> findAllByShop_Vendor_User_Id(Long userId);
    List<Product> findAllByShop_Id(Long shopId);
    List<Product> findAllByShop_Slug(String slug);
    Optional<Product> findByShop_Vendor_User_Username_AndId(String username, Long id);
}
