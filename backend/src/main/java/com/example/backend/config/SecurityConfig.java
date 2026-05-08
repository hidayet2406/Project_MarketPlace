package com.example.backend.config;

import com.example.backend.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow Vite dev server (5173) and preview (often 4173), and other localhost ports.
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        // Be explicit: Authorization header triggers preflight and must be allowed.
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,JwtService jwtService) throws Exception {

        http
                .cors(Customizer.withDefaults())
                //.csrf().disable()
                 .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                         // Allow CORS preflight requests through Spring Security
                         .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                         // Static product images
                         .requestMatchers("/pictures/**").permitAll()
                        .requestMatchers("/auth/**","/category/**").permitAll()
                        // Product browsing is public
                        .requestMatchers(HttpMethod.GET, "/product/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/shop/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/shop/*/products").permitAll()
                        // Creating/updating a review requires authentication
                        .requestMatchers(HttpMethod.POST, "/product/*/reviews").hasAnyRole("USER","ADMIN")
                        // Keep other product endpoints as they were (public) for now
                        .requestMatchers("/product/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/user/**").hasAnyRole("USER","ADMIN","VENDOR")
                        .requestMatchers("/shop/**").hasAnyRole("VENDOR","ADMIN")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider(jwtService,passwordEncoder()))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception{
        return configuration.getAuthenticationManager();
    }

    @Bean
    AuthenticationProvider authenticationProvider(JwtService jwtService,PasswordEncoder passwordEncoder){

        DaoAuthenticationProvider daoAuthenticationProvider = new DaoAuthenticationProvider();
        daoAuthenticationProvider.setUserDetailsService(jwtService);
        daoAuthenticationProvider.setPasswordEncoder(passwordEncoder);

        return daoAuthenticationProvider;
    }

}
