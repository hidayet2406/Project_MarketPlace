package com.example.backend.repository;

import com.example.backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    Optional<Address> findByUser_Id(Long userId);
}
