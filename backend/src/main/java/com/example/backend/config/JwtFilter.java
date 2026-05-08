package com.example.backend.config;

import com.example.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        if (request.getServletPath().startsWith("/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if(authHeader != null && authHeader.startsWith("Bearer ")){
            String token = authHeader.substring(7).trim();

            // Fast reject: a JWS compact token has exactly 2 periods.
            if(token.chars().filter(ch -> ch == '.').count() == 2){
                try{
                    if (jwtUtil.validateToken(token)){
                        String username = jwtUtil.getUsernameFromToken(token);
                        if(username != null && SecurityContextHolder.getContext().getAuthentication() == null){
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    }
                }catch(Exception ignored){
                    // Invalid token should not crash request processing; treat as anonymous.
                }
            }
        }
        filterChain.doFilter(request,response);
    }
}

