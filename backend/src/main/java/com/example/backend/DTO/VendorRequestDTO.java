package com.example.backend.DTO;

import com.example.backend.entity.enums.VendorStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VendorRequestDTO {

    private VendorStatus status;

    private LocalDateTime created_at;

}
