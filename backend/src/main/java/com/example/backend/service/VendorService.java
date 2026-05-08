package com.example.backend.service;

import com.example.backend.DTO.VendorRequestDTO;
import com.example.backend.entity.User;
import com.example.backend.entity.Vendor;
import com.example.backend.entity.enums.VendorStatus;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VendorService {

    @Autowired
    VendorRepository vendorRepository;

    @Autowired
    UserRepository userRepository;

    public VendorRequestDTO requestVendor(String username){

        User user = userRepository.findByUsername(username)
                .orElseThrow(()->new RuntimeException("USER NOT FOUND"));

        if (isBlank(user.getFirstName()) || isBlank(user.getLastName()) || isBlank(user.getPhone())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "FIRST_NAME_LAST_NAME_AND_PHONE_REQUIRED"
            );
        }

        Vendor existingVendor = vendorRepository.findByUserUsername(username).orElse(null);
        if (existingVendor != null) {
            return toDto(existingVendor);
        }

        Vendor vendor = new Vendor();
        vendor.setStatus(VendorStatus.PENDING);
        vendor.setCreated_at(LocalDateTime.now());
        vendor.setUser(user);
        vendorRepository.save(vendor);

        return toDto(vendor);

    }

    public VendorRequestDTO getVendorRequest(String username) {
        return vendorRepository.findByUserUsername(username)
                .map(this::toDto)
                .orElse(null);
    }

    public List<Vendor> getVendors(){
        return vendorRepository.findAll();
    }

    public VendorRequestDTO updateVendors(Long id,VendorRequestDTO vendorRequestDTO){

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(()->new RuntimeException("VENDOR NOT FOUND"));

        vendor.setStatus(vendorRequestDTO.getStatus());
        if (vendorRequestDTO.getStatus() == VendorStatus.APPROVED) {
            User user = vendor.getUser();
            if (user != null) {
                user.setRole("VENDOR");
                userRepository.save(user);
            }
        }
        vendorRepository.save(vendor);

        return toDto(vendor);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private VendorRequestDTO toDto(Vendor vendor) {
        return new VendorRequestDTO(
                vendor.getStatus(),
                vendor.getCreated_at()
        );
    }
}
