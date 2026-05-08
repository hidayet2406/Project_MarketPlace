package com.example.backend.repository;

import com.example.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Transactional
    void deleteByProduct_Id(Long productId);
}
