package com.example.backend.service;

import com.example.backend.DTO.ShopDTO;
import com.example.backend.entity.Shop;
import com.example.backend.entity.Vendor;
import com.example.backend.entity.enums.ShopStatus;
import com.example.backend.entity.enums.VendorStatus;
import com.example.backend.repository.ShopRepository;
import com.example.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class ShopService {

    @Autowired
    ShopRepository shopRepository;

    @Autowired
    VendorRepository vendorRepository;

    public ShopDTO getMyShop(String username) {
        return shopRepository.findByVendorUserUsername(username)
                .map(this::toDto)
                .orElse(null);
    }

    public ShopDTO getShopBySlug(String slug) {
        return shopRepository.findBySlug(slug)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SHOP_NOT_FOUND"));
    }

    public ShopDTO createShop(String username, ShopDTO shopDTO) {
        Vendor vendor = vendorRepository.findByUserUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "VENDOR_REQUEST_REQUIRED"));

        if (vendor.getStatus() != VendorStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "VENDOR_NOT_APPROVED");
        }

        Shop existingShop = shopRepository.findByVendorUserUsername(username).orElse(null);
        if (existingShop != null) {
            return toDto(existingShop);
        }

        String name = safeTrim(shopDTO.getName());
        String description = safeTrim(shopDTO.getDescription());
        String slugInput = safeTrim(shopDTO.getSlug());

        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SHOP_NAME_REQUIRED");
        }

        String slug = slugInput.isEmpty() ? slugify(name) : slugify(slugInput);
        if (slug.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SHOP_SLUG_REQUIRED");
        }

        if (shopRepository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SHOP_SLUG_ALREADY_EXISTS");
        }

        Shop shop = new Shop();
        shop.setName(name);
        shop.setSlug(slug);
        shop.setDescription(description);
        shop.setStatus(ShopStatus.ACTIVE);
        shop.setVendor(vendor);
        shopRepository.save(shop);

        return toDto(shop);
    }

    private ShopDTO toDto(Shop shop) {
        return new ShopDTO(
                shop.getName(),
                shop.getSlug(),
                shop.getDescription(),
                shop.getStatus() != null ? shop.getStatus().name() : null
        );
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String slugify(String value) {
        String normalized = safeTrim(value).toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("[^a-z0-9]+", "-");
        normalized = normalized.replaceAll("^-+|-+$", "");
        return normalized;
    }
}
