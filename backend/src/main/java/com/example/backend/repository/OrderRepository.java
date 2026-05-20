package com.example.backend.repository;

import com.example.backend.entity.Order;
import com.example.backend.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByUser_Id(Long userId);

    boolean existsByUser_IdAndOrderItems_Product_IdAndStatusNot(Long userId, Long productId, OrderStatus status);
}
