package com.example.backend.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

    private final String secret_key = "mysecretkeymysecretkeymysecretkey123";

    public String generateToken(String username){

        long jwtExpiration = 86400000;

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis()+ jwtExpiration))
                .signWith(Keys.hmacShaKeyFor(secret_key.getBytes()))
                .compact();
    }

    public String getUsernameFromToken(String token){
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(secret_key.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token){

        try {
            Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(secret_key.getBytes()))
                    .build()
                    .parseClaimsJws(token);

            return true;
        } catch (Exception e){
            return false;
        }
    }
}
