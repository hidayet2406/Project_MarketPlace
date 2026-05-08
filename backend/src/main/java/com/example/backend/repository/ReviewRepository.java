package com.example.backend.repository;

import com.example.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findAllByProduct_IdOrderByUpdatedAtDescCreatedAtDesc(Long productId);

    Optional<Review> findByProduct_IdAndUser_Id(Long productId, Long userId);

    Optional<Review> findTopByProduct_IdAndUser_IsNullAndAuthorNameIgnoreCaseOrderByUpdatedAtDescCreatedAtDesc(Long productId, String authorName);

    void deleteByUser_Id(Long userId);

    void deleteByProduct_Id(Long productId);
}
