package et.guzo.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final MerchantApiKeyFilter merchantApiKeyFilter;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/", "/health").permitAll()
                .requestMatchers("/auth/register", "/auth/login", "/auth/refresh", "/auth/logout",
                    "/auth/forgot-password", "/auth/reset-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/orders/quote").permitAll()
                .requestMatchers(HttpMethod.GET, "/orders/track/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/marketing/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/marketing/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/branches").permitAll()
                .requestMatchers(HttpMethod.GET, "/branches/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/receivers/lookup").permitAll()
                .requestMatchers(HttpMethod.POST, "/pickup/verify", "/otp/send", "/otp/verify").permitAll()
                .requestMatchers(HttpMethod.GET, "/maps/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/static/**").permitAll()
                .requestMatchers("/merchant-api/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(merchantApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
