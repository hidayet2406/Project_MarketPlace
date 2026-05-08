package com.example.backend.controller;

import com.example.backend.entity.Category;
import com.example.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("category")
public class CategoryController {

    @Autowired
    CategoryRepository categoryRepository;

    @GetMapping("/getCategories")
    public List<Category> getAllCategories(){
        return categoryRepository.findAll();
    }

}
