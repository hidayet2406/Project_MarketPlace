package com.example.backend.service;

import com.example.backend.DTO.ShopDTO;
import com.example.backend.entity.Product;
import com.example.backend.entity.Shop;
import com.example.backend.entity.enums.ShopStatus;
import com.example.backend.repository.CartItemRepository;
import com.example.backend.repository.OrderItemRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminCatalogService {

    @Autowired
    ShopRepository shopRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    ReviewRepository reviewRepository;

    @Autowired
    CartItemRepository cartItemRepository;

    @Autowired
    OrderItemRepository orderItemRepository;

    public List<Shop> getAllShops() {
        return shopRepository.findAll();
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional
    public ShopDTO updateShopStatus(Long shopId, ShopDTO request) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SHOP_NOT_FOUND"));

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SHOP_STATUS_REQUIRED");
        }

        try {
            shop.setStatus(ShopStatus.valueOf(request.getStatus().trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_SHOP_STATUS");
        }

        shopRepository.save(shop);
        return new ShopDTO(shop.getName(), shop.getSlug(), shop.getDescription(), shop.getStatus().name());
    }

    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND"));

        reviewRepository.deleteByProduct_Id(productId);
        cartItemRepository.deleteByProduct_Id(productId);
        orderItemRepository.deleteByProduct_Id(productId);
        productRepository.delete(product);
    }

    @Transactional
    public void deleteShop(Long shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SHOP_NOT_FOUND"));

        List<Product> products = productRepository.findAllByShop_Id(shopId);
        for (Product product : products) {
            if (product.getId() == null) continue;
            reviewRepository.deleteByProduct_Id(product.getId());
            cartItemRepository.deleteByProduct_Id(product.getId());
            orderItemRepository.deleteByProduct_Id(product.getId());
        }
        if (!products.isEmpty()) {
            productRepository.deleteAll(products);
        }

        shopRepository.delete(shop);
    }
}
