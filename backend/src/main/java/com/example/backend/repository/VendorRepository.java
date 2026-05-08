package com.example.backend.repository;

import com.example.backend.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor,Long> {
    Optional<Vendor> findByUserUsername(String username);
    Optional<Vendor> findByUser_Id(Long userId);
}
