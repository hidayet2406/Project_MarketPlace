package com.example.backend.service;

import com.example.backend.DTO.ReviewCreateDTO;
import com.example.backend.DTO.ReviewResponseDTO;
import com.example.backend.entity.Product;
import com.example.backend.entity.Review;
import com.example.backend.entity.User;
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

    @Autowired
    UserRepository userRepository;

    public ReviewResponseDTO upsertReview(Long productId, String username, ReviewCreateDTO request){

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("PRODUCT NOT FOUND"));

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new RuntimeException("USER NOT FOUND"));

        String ownerUsername = product.getShop() != null
                && product.getShop().getVendor() != null
                && product.getShop().getVendor().getUser() != null
                ? product.getShop().getVendor().getUser().getUsername()
                : null;

        if (ownerUsername != null && ownerUsername.equalsIgnoreCase(user.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OWN_PRODUCT_REVIEW_NOT_ALLOWED");
        }

        Review review = reviewRepository.findByProduct_IdAndUser_Id(productId, user.getId())
                .orElseGet(() -> {
                    // Migration path: older reviews were stored as guest reviews (user=null).
                    // If we find one for the same authorName, upgrade it by attaching the user.
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
