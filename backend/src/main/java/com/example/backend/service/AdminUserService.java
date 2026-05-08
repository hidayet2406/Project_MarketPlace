package com.example.backend.service;

import com.example.backend.entity.Cart;
import com.example.backend.entity.Order;
import com.example.backend.entity.Product;
import com.example.backend.entity.Shop;
import com.example.backend.entity.User;
import com.example.backend.entity.Vendor;
import com.example.backend.repository.AddressRepository;
import com.example.backend.repository.CartItemRepository;
import com.example.backend.repository.CartRepository;
import com.example.backend.repository.OrderItemRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminUserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    VendorRepository vendorRepository;

    @Autowired
    ShopRepository shopRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    ReviewRepository reviewRepository;

    @Autowired
    CartRepository cartRepository;

    @Autowired
    CartItemRepository cartItemRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    OrderItemRepository orderItemRepository;

    @Autowired
    AddressRepository addressRepository;

    @Transactional
    public void deleteUserCascade(Long userId, String actingUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN_DELETE_NOT_ALLOWED");
        }

        if (actingUsername != null && actingUsername.equalsIgnoreCase(user.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SELF_DELETE_NOT_ALLOWED");
        }

        reviewRepository.deleteByUser_Id(userId);

        List<Product> products = productRepository.findAllByShop_Vendor_User_Id(userId);
        for (Product product : products) {
            if (product.getId() == null) continue;
            reviewRepository.deleteByProduct_Id(product.getId());
            cartItemRepository.deleteByProduct_Id(product.getId());
            orderItemRepository.deleteByProduct_Id(product.getId());
        }
        if (!products.isEmpty()) {
            productRepository.deleteAll(products);
        }

        shopRepository.findByVendor_User_Id(userId).ifPresent(shopRepository::delete);
        vendorRepository.findByUser_Id(userId).ifPresent(vendorRepository::delete);

        cartRepository.findByUser_Id(userId).ifPresent(cartRepository::delete);

        List<Order> orders = orderRepository.findAllByUser_Id(userId);
        if (!orders.isEmpty()) {
            orderRepository.deleteAll(orders);
        }

        addressRepository.findByUser_Id(userId).ifPresent(addressRepository::delete);

        userRepository.delete(user);
    }
}
