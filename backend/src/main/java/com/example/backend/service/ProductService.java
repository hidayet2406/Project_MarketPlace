package com.example.backend.service;

import com.example.backend.config.StringManipulation;
import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.entity.Shop;
import com.example.backend.repository.ShopRepository;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    ProductRepository productRepository;

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    ShopRepository shopRepository;

    public Product insertProduct(Product request, String categoryName){

        Category category = categoryRepository.findByName(categoryName)
                .orElseThrow(()->new RuntimeException("Category not found"));

        Product product = new Product();
        product.setName(StringManipulation.capitalizeWords(request.getName()));
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImagePath(normalizeImagePath(request.getImagePath()));
        product.setCategory(category);
        productRepository.save(product);
        return product;
    }

    public Product insertProductForMyShop(String username, Product request, String categoryName) {
        Shop shop = shopRepository.findByVendorUserUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "SHOP_REQUIRED"));

        Category category = categoryRepository.findByName(categoryName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND"));

        Product product = new Product();
        product.setName(StringManipulation.capitalizeWords(request.getName()));
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImagePath(normalizeImagePath(request.getImagePath()));
        product.setCategory(category);
        product.setShop(shop);
        productRepository.save(product);
        return product;
    }

    public Product updateMyShopProduct(String username, Long productId, Product request, String categoryName) {
        Product product = productRepository.findByShop_Vendor_User_Username_AndId(username, productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND"));

        Category category = categoryRepository.findByName(categoryName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND"));

        product.setName(StringManipulation.capitalizeWords(request.getName()));
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImagePath(normalizeImagePath(request.getImagePath()));
        product.setCategory(category);
        productRepository.save(product);
        return product;
    }

    public Product getProductById(Long product_id){
        return productRepository.findById(product_id)
                .orElseThrow(()->new RuntimeException("PRODUCT NOT FOUND"));
    }

    public List<Product> getProductsByCategory(String categoryName){

        Category category = categoryRepository.findByName(categoryName)
                .orElseThrow(()->new RuntimeException("Category not found"));

        return productRepository.findAllByCategory_Name(categoryName);
    }

    public List<Product> getAllProducts(){
        return productRepository.findAll();
    }

    public List<Product> getMyShopProducts(String username) {
        return productRepository.findAllByShop_Vendor_User_Username(username);
    }

    public List<Product> getProductsByShopSlug(String slug) {
        return productRepository.findAllByShop_Slug(slug);
    }

    public void deleteMyShopProduct(String username, Long productId) {
        Product product = productRepository.findByShop_Vendor_User_Username_AndId(username, productId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"PRODUCT_NOT_FOUND"));

        productRepository.delete(product);
    }

    public String uploadProductImage(String username, MultipartFile file) {
        shopRepository.findByVendorUserUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "SHOP_REQUIRED"));

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IMAGE_REQUIRED");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_IMAGE_TYPE");
        }

        String extension = getFileExtension(file.getOriginalFilename());
        if (extension == null) {
            extension = ".jpg";
        }

        Path imageDir = resolveImageDirectory();
        try {
            Files.createDirectories(imageDir);
            String fileName = "shop-" + UUID.randomUUID() + extension;
            Path target = imageDir.resolve(fileName).normalize();
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return "/pictures/" + fileName;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "IMAGE_UPLOAD_FAILED");
        }
    }

    private String normalizeImagePath(String imagePath) {
        if (imagePath != null) {
            imagePath = imagePath.trim();
        }
        if (imagePath == null || imagePath.isBlank()) {
            return null;
        }
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
            return imagePath;
        }

        imagePath = imagePath.replace("\\", "/");
        if (imagePath.startsWith("pictures/")) {
            imagePath = "/" + imagePath;
        } else if (!imagePath.startsWith("/pictures/") && !imagePath.startsWith("/")) {
            imagePath = "/pictures/" + imagePath;
        }
        return imagePath;
    }

    private Path resolveImageDirectory() {
        Path base = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        for (int i = 0; i < 6 && base != null; i++) {
            Path candidate = base.resolve("Picture");
            if (Files.isDirectory(candidate) || Files.exists(candidate.getParent())) {
                return candidate;
            }
            base = base.getParent();
        }
        return Paths.get("Picture").toAbsolutePath().normalize();
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return null;
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == fileName.length() - 1) return null;
        return fileName.substring(lastDot).toLowerCase();
    }

}
