package com.example.backend.repository;

import com.example.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCart_IdAndProduct_Id(Long cartId, Long productId);

    @Transactional
    void deleteByCart_IdAndProduct_Id(Long cartId, Long productId);

    @Transactional
    void deleteByProduct_Id(Long productId);

    // Join-fetch product to avoid lazy-loading issues and to always reflect latest DB state.
    @Query("select ci from CartItem ci join fetch ci.product where ci.cart.id = :cartId")
    List<CartItem> findAllByCartIdWithProduct(@Param("cartId") Long cartId);
}
