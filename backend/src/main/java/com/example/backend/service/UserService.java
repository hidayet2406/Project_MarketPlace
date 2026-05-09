package com.example.backend.service;

import com.example.backend.DTO.AddressDTO;
import com.example.backend.entity.Address;
import com.example.backend.DTO.UserProfileUpdateDTO;
import com.example.backend.entity.User;
import com.example.backend.repository.AddressRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    AddressRepository addressRepository;

    public User updateProfile(String username, UserProfileUpdateDTO userProfileUpdateDTO){
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        user.setFirstName(trimToNull(userProfileUpdateDTO.getFirstName()));
        user.setLastName(trimToNull(userProfileUpdateDTO.getLastName()));
        user.setPhone(trimToNull(userProfileUpdateDTO.getPhone()));
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public AddressDTO getAddress(String username){
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        return addressRepository.findByUser_Id(user.getId())
                .map(this::toAddressDto)
                .orElse(new AddressDTO(null, null, null, null, null));
    }

    public AddressDTO updateAddress(String username, AddressDTO addressDTO){
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        Address address = addressRepository.findByUser_Id(user.getId())
                .orElseGet(() -> {
                    Address item = new Address();
                    item.setUser(user);
                    return item;
                });

        address.setStreet(trimToNull(addressDTO.getStreet()));
        address.setCity(trimToNull(addressDTO.getCity()));
        address.setState(trimToNull(addressDTO.getState()));
        address.setCountry(trimToNull(addressDTO.getCountry()));
        address.setZipCode(trimToNull(addressDTO.getZipCode()));

        return toAddressDto(addressRepository.save(address));
    }

    public User addFunds(String username, BigDecimal amount) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        BigDecimal currentWallet = user.getWallet() != null ? user.getWallet() : BigDecimal.ZERO;
        user.setWallet(currentWallet.add(amount));
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    private String trimToNull(String value){
        if(value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private AddressDTO toAddressDto(Address address){
        return new AddressDTO(
                address.getStreet(),
                address.getCity(),
                address.getState(),
                address.getCountry(),
                address.getZipCode()
        );
    }
}
