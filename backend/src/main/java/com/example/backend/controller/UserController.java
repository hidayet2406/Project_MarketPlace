package com.example.backend.controller;

import com.example.backend.DTO.AddressDTO;
import com.example.backend.DTO.UserOrderSummaryDTO;
import com.example.backend.DTO.UserProfileUpdateDTO;
import com.example.backend.DTO.VendorRequestDTO;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import com.example.backend.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    VendorService vendorService;

    @Autowired
    UserService userService;


    @GetMapping("/findMe")
    public User findMe(@AuthenticationPrincipal UserDetails principal){
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER NOT FOUND"));
    }

    @PutMapping("/profile")
    public User updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody UserProfileUpdateDTO userProfileUpdateDTO
    ){
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return userService.updateProfile(principal.getUsername(), userProfileUpdateDTO);
    }

    @GetMapping("/address")
    public AddressDTO getAddress(@AuthenticationPrincipal UserDetails principal){
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return userService.getAddress(principal.getUsername());
    }

    @PutMapping("/address")
    public AddressDTO updateAddress(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody AddressDTO addressDTO
    ){
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return userService.updateAddress(principal.getUsername(), addressDTO);
    }

    @GetMapping("/orders")
    public List<UserOrderSummaryDTO> getOrders(@AuthenticationPrincipal UserDetails principal){
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return userService.getOrders(principal.getUsername());
    }


    @PostMapping("/vendor")
    public VendorRequestDTO requestVendor(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return vendorService.requestVendor(principal.getUsername());
    }

    @GetMapping("/vendor")
    public VendorRequestDTO getVendorRequest(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return vendorService.getVendorRequest(principal.getUsername());
    }



}
