package com.example.backend.service;

import com.example.backend.DTO.ReviewCreateDTO;
import com.example.backend.DTO.ReviewResponseDTO;
import com.example.backend.entity.Product;
import com.example.backend.entity.Review;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    ReviewRepository reviewRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    UserRepository userRepository;

    public List<ReviewResponseDTO> getReviewsForProduct(Long productId){
        return reviewRepository.findAllByProduct_IdOrderByUpdatedAtDescCreatedAtDesc(productId)
                .stream()
                .map(r -> new ReviewResponseDTO(
                        r.getId(),
                        r.getUser() != null ? r.getUser().getUsername() : r.getAuthorName(),
                        r.getRating(),
                        r.getText(),
                        r.getCreatedAt() != null ? r.getCreatedAt().toString() : null
                ))
                .toList();
    }

    public boolean canUserReviewProduct(Long productId, String username) {
        if (username == null) return false;

        User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null) return false;

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return false;

        String ownerUsername = product.getShop() != null
                && product.getShop().getVendor() != null
                && product.getShop().getVendor().getUser() != null
                ? product.getShop().getVendor().getUser().getUsername()
                : null;

        if (ownerUsername != null && ownerUsername.equalsIgnoreCase(user.getUsername())) {
            return false;
        }

        return orderRepository.existsByUser_IdAndOrderItems_Product_IdAndStatusNot(
                user.getId(), productId, OrderStatus.CANCELLED
        );
    }

    public ReviewResponseDTO upsertReview(Long productId, String username, ReviewCreateDTO request){

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PRODUCT NOT FOUND"));

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER NOT FOUND"));

        if (!canUserReviewProduct(productId, username)) {
            String ownerUsername = product.getShop() != null
                    && product.getShop().getVendor() != null
                    && product.getShop().getVendor().getUser() != null
                    ? product.getShop().getVendor().getUser().getUsername()
                    : null;

            if (ownerUsername != null && ownerUsername.equalsIgnoreCase(user.getUsername())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OWN_PRODUCT_REVIEW_NOT_ALLOWED");
            }

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PURCHASE_REQUIRED_FOR_REVIEW");
        }

        Review review = reviewRepository.findByProduct_IdAndUser_Id(productId, user.getId())
                .orElseGet(() -> {
                    return reviewRepository.findTopByProduct_IdAndUser_IsNullAndAuthorNameIgnoreCaseOrderByUpdatedAtDescCreatedAtDesc(
                                    productId,
                                    user.getUsername()
                            )
                            .map(r -> {
                                r.setUser(user);
                                if(r.getCreatedAt() == null) r.setCreatedAt(LocalDateTime.now());
                                return r;
                            })
                            .orElseGet(() -> {
                                Review r = new Review();
                                r.setProduct(product);
                                r.setUser(user);
                                r.setCreatedAt(LocalDateTime.now());
                                return r;
                            });
                });

        review.setAuthorName(user.getUsername());
        int rating = request.getRating() == null ? 5 : request.getRating();
        rating = Math.max(1, Math.min(5, rating));
        review.setRating(rating);
        review.setText(request.getText() == null ? "" : request.getText().trim());
        review.setUpdatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        return new ReviewResponseDTO(
                saved.getId(),
                saved.getUser() != null ? saved.getUser().getUsername() : saved.getAuthorName(),
                saved.getRating(),
                saved.getText(),
                saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : null
        );
    }
}
