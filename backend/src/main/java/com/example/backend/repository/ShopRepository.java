package com.example.backend.repository;

import com.example.backend.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop,Long> {
    Optional<Shop> findByVendorUserUsername(String username);
    Optional<Shop> findByVendor_User_Id(Long userId);
    Optional<Shop> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
