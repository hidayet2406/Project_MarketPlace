package com.example.backend.service;

import com.example.backend.DTO.AddressDTO;
import com.example.backend.DTO.UserOrderSummaryDTO;
import com.example.backend.entity.Address;
import com.example.backend.entity.Order;
import com.example.backend.entity.OrderItem;
import com.example.backend.DTO.UserProfileUpdateDTO;
import com.example.backend.entity.User;
import com.example.backend.repository.AddressRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    AddressRepository addressRepository;

    @Autowired
    OrderRepository orderRepository;

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

    public List<UserOrderSummaryDTO> getOrders(String username){
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        List<Order> orders = orderRepository.findAllByUser_Id(user.getId());
        orders.sort(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        List<UserOrderSummaryDTO> result = new ArrayList<>();
        for (Order order : orders) {
            List<UserOrderSummaryDTO.Item> items = new ArrayList<>();
            if (order.getOrderItems() != null) {
                for (OrderItem orderItem : order.getOrderItems()) {
                    items.add(new UserOrderSummaryDTO.Item(
                            orderItem.getProduct() != null ? orderItem.getProduct().getId() : null,
                            orderItem.getProduct() != null ? orderItem.getProduct().getName() : "Product",
                            orderItem.getProduct() != null ? orderItem.getProduct().getImagePath() : null,
                            orderItem.getQuantity(),
                            orderItem.getPrice()
                    ));
                }
            }

            result.add(new UserOrderSummaryDTO(
                    order.getId(),
                    order.getStatus(),
                    order.getTotalAmount(),
                    order.getCreatedAt(),
                    order.getShippingAddress() != null ? order.getShippingAddress().getCity() : null,
                    order.getShippingAddress() != null ? order.getShippingAddress().getCountry() : null,
                    items
            ));
        }

        return result;
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
