package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShopDTO {

    private String name;

    private String slug;

    private String description;

    private String status;

}
