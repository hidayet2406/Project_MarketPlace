package com.example.backend.service;

import com.example.backend.DTO.UserOrderSummaryDTO;
import com.example.backend.entity.Cart;
import com.example.backend.entity.Order;
import com.example.backend.entity.OrderItem;
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
import java.util.ArrayList;
import java.util.Comparator;

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

    public List<UserOrderSummaryDTO> getUserOrderHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

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
