package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    /**
     * Folder on disk to serve product images from.
     *
     * Example (Windows): C:/Users/Asus/Desktop/Project/Picture
     * Example (relative): ../Picture (relative to backend working dir)
     */
    @Value("${app.images.dir:}")
    private String imagesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = null;

        if (imagesDir != null && !imagesDir.isBlank()) {
            Path configured = Paths.get(imagesDir).toAbsolutePath().normalize();
            if (Files.isDirectory(configured)) {
                dir = configured;
            }
        }

        // Fallback: search for a "Picture" folder up the directory tree.
        if (dir == null) {
            Path base = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
            for (int i = 0; i < 6 && base != null; i++) {
                Path candidate = base.resolve("Picture");
                if (Files.isDirectory(candidate)) {
                    dir = candidate;
                    break;
                }
                base = base.getParent();
            }
        }

        if (dir == null) return;

        String location = dir.toUri().toString(); // file:///C:/.../Picture
        if (!location.endsWith("/")) location = location + "/";

        registry.addResourceHandler("/pictures/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }
}
