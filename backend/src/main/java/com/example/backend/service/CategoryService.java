package com.example.backend.service;

import com.example.backend.entity.Category;
import com.example.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public String insertCategory(Category category){
        Category category1 = new Category();
        category1.setName(category.getName());
        category1.setDescription(category.getDescription());

        categoryRepository.save(category1);
        return "NEW CATEGORY INSERTED";
    }



}
