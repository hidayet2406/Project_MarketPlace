package com.example.backend.service;

import com.example.backend.DTO.AddressDTO;
import com.example.backend.DTO.CheckoutRequestDTO;
import com.example.backend.DTO.CheckoutResponseDTO;
import com.example.backend.entity.Address;
import com.example.backend.entity.Cart;
import com.example.backend.entity.CartItem;
import com.example.backend.entity.Order;
import com.example.backend.entity.OrderItem;
import com.example.backend.entity.Product;
import com.example.backend.entity.Transaction;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.TransactionStatus;
import com.example.backend.repository.AddressRepository;
import com.example.backend.repository.CartItemRepository;
import com.example.backend.repository.CartRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.TransactionRepository;
import com.example.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    public Transaction Deposit(String username, BigDecimal amount) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        Transaction transaction = new Transaction();
        transaction.setStatus(TransactionStatus.DEPOSIT);
        transaction.setAmount(amount);
        transaction.setUser(user);

        user.setWallet(defaultWallet(user.getWallet()).add(amount));

        return transactionRepository.save(transaction);
    }

    public Transaction Withdraw(String username, BigDecimal amount) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        BigDecimal walletBalance = defaultWallet(user.getWallet());
        if (walletBalance.subtract(amount).compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "INSUFFICIENT WALLET BALANCE");
        }

        Transaction transaction = new Transaction();
        transaction.setStatus(TransactionStatus.WITHDRAW);
        transaction.setAmount(amount);
        transaction.setUser(user);

        user.setWallet(walletBalance.subtract(amount));
        return transactionRepository.save(transaction);
    }

    public CheckoutResponseDTO checkoutWithWallet(String username, CheckoutRequestDTO request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        if (request == null || request.getProductIds() == null || request.getProductIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NO PRODUCTS SELECTED");
        }
        if (request.getAddress() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADDRESS IS REQUIRED");
        }

        Cart cart = cartRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "CART NOT FOUND"));

        List<CartItem> cartItems = cartItemRepository.findAllByCartIdWithProduct(cart.getId());
        Set<Long> selectedIds = new LinkedHashSet<>(request.getProductIds());
        List<CartItem> selectedItems = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (product != null && selectedIds.contains(product.getId())) {
                selectedItems.add(cartItem);
            }
        }

        if (selectedItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SELECTED PRODUCTS NOT FOUND IN CART");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        int itemCount = 0;

        for (CartItem cartItem : selectedItems) {
            Product product = cartItem.getProduct();
            if (product == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID CART ITEM");
            }

            int quantity = cartItem.getQuantity() == null ? 0 : cartItem.getQuantity();
            if (quantity <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID ITEM QUANTITY");
            }

            Integer stock = product.getStock();
            if (stock != null && stock < quantity) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "NOT ENOUGH STOCK FOR " + product.getName());
            }

            BigDecimal price = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();
            subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(quantity)));
            itemCount += quantity;
        }

        BigDecimal shippingAmount = subtotal.compareTo(BigDecimal.ZERO) == 0 || subtotal.compareTo(BigDecimal.valueOf(150)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(12.9).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(shippingAmount);

        BigDecimal walletBalance = defaultWallet(user.getWallet());
        if (walletBalance.compareTo(totalAmount) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "INSUFFICIENT WALLET BALANCE");
        }

        Address shippingAddress = upsertAddress(user, request.getAddress());
        LocalDateTime now = LocalDateTime.now();

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(shippingAddress);
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        order.setTotalAmount(totalAmount);

        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : selectedItems) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();
            BigDecimal price = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();

            if (product.getStock() != null) {
                product.setStock(product.getStock() - quantity);
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPrice(price);
            orderItems.add(orderItem);
        }
        order.setOrderItems(orderItems);

        user.setWallet(walletBalance.subtract(totalAmount));

        Transaction transaction = new Transaction();
        transaction.setStatus(TransactionStatus.PURCHASE);
        transaction.setAmount(totalAmount);
        transaction.setUser(user);

        Order savedOrder = orderRepository.save(order);
        Transaction savedTransaction = transactionRepository.save(transaction);
        cartItemRepository.deleteAll(selectedItems);

        return new CheckoutResponseDTO(
                savedOrder.getId(),
                savedTransaction.getId(),
                itemCount,
                subtotal,
                shippingAmount,
                totalAmount,
                defaultWallet(user.getWallet())
        );
    }

    private Address upsertAddress(User user, AddressDTO addressDTO) {
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

        if (Objects.requireNonNullElse(address.getStreet(), "").isBlank()
                || Objects.requireNonNullElse(address.getCity(), "").isBlank()
                || Objects.requireNonNullElse(address.getCountry(), "").isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADDRESS IS INCOMPLETE");
        }

        return addressRepository.save(address);
    }

    private BigDecimal defaultWallet(BigDecimal wallet) {
        return wallet == null ? BigDecimal.ZERO : wallet;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
