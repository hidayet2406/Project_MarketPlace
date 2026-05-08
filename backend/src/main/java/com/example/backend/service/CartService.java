package com.example.backend.service;

import com.example.backend.DTO.CartItemUpsertDTO;
import com.example.backend.DTO.CartResponseDTO;
import com.example.backend.entity.Cart;
import com.example.backend.entity.CartItem;
import com.example.backend.entity.Product;
import com.example.backend.entity.User;
import com.example.backend.repository.CartItemRepository;
import com.example.backend.repository.CartRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class CartService {

    @Autowired
    CartRepository cartRepository;

    @Autowired
    CartItemRepository cartItemRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    UserRepository userRepository;

    @Transactional
    public CartResponseDTO getCart(String username){
        Cart cart = getOrCreateCart(username);
        return toResponse(cart);
    }

    @Transactional
    public CartResponseDTO addItem(String username, CartItemUpsertDTO request){
        if(request.getProductId() == null) throw new RuntimeException("productId is required");
        int qty = request.getQuantity() == null ? 1 : request.getQuantity();
        qty = Math.max(1, qty);

        Cart cart = getOrCreateCart(username);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("PRODUCT NOT FOUND"));

        Integer stock = product.getStock();
        if(stock != null && stock <= 0){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Out of stock");
        }

        CartItem item = cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId())
                .orElseGet(() -> {
                    CartItem ci = new CartItem();
                    ci.setCart(cart);
                    ci.setProduct(product);
                    ci.setQuantity(0);
                    return ci;
                });

        int nextQty = item.getQuantity() + qty;
        if(stock != null && nextQty > stock){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough stock");
        }
        item.setQuantity(nextQty);
        cartItemRepository.save(item);

        // Refresh cart items for response
        Cart refreshed = cartRepository.findById(cart.getId()).orElseThrow();
        return toResponse(refreshed);
    }

    @Transactional
    public CartResponseDTO setItemQuantity(String username, CartItemUpsertDTO request){
        if(request.getProductId() == null) throw new RuntimeException("productId is required");
        int qty = request.getQuantity() == null ? 1 : request.getQuantity();
        qty = Math.max(0, qty);

        Cart cart = getOrCreateCart(username);
        if(qty == 0){
            cartItemRepository.deleteByCart_IdAndProduct_Id(cart.getId(), request.getProductId());
            Cart refreshed = cartRepository.findById(cart.getId()).orElseThrow();
            return toResponse(refreshed);
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("PRODUCT NOT FOUND"));

        Integer stock = product.getStock();
        if(stock != null && qty > stock){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough stock");
        }

        CartItem item = cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId())
                .orElseGet(() -> {
                    CartItem ci = new CartItem();
                    ci.setCart(cart);
                    ci.setProduct(product);
                    ci.setQuantity(0);
                    return ci;
                });

        item.setQuantity(qty);
        cartItemRepository.save(item);

        Cart refreshed = cartRepository.findById(cart.getId()).orElseThrow();
        return toResponse(refreshed);
    }

    @Transactional
    public CartResponseDTO removeItem(String username, Long productId){
        Cart cart = getOrCreateCart(username);
        cartItemRepository.deleteByCart_IdAndProduct_Id(cart.getId(), productId);
        Cart refreshed = cartRepository.findById(cart.getId()).orElseThrow();
        return toResponse(refreshed);
    }

    private Cart getOrCreateCart(String username){
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        return cartRepository.findByUser_Username(username)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUser(user);
                    cart.setCartItems(new ArrayList<>());
                    return cartRepository.save(cart);
                });
    }

    private CartResponseDTO toResponse(Cart cart){
        List<CartResponseDTO.Item> items = new ArrayList<>();
        int totalQty = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        if(cart != null && cart.getId() != null){
            // Always read cart items from DB to avoid returning stale collections after delete/update.
            List<CartItem> cartItems = cartItemRepository.findAllByCartIdWithProduct(cart.getId());
            for(CartItem ci : cartItems){
                Product p = ci.getProduct();
                if(p == null) continue;
                int q = ci.getQuantity() == null ? 0 : ci.getQuantity();
                BigDecimal price = p.getPrice() == null ? BigDecimal.ZERO : p.getPrice();
                BigDecimal line = price.multiply(BigDecimal.valueOf(q));
                items.add(new CartResponseDTO.Item(
                        p.getId(),
                        p.getName(),
                        price,
                        p.getImagePath(),
                        q,
                        line
                ));
                totalQty += q;
                totalAmount = totalAmount.add(line);
            }
        }

        return new CartResponseDTO(items, totalQty, totalAmount);
    }
}
