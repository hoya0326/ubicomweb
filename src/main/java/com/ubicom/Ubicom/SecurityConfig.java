package com.ubicom.Ubicom;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // 1. CSRF 비활성화
        http.csrf((csrf) -> csrf.disable());

        // 2. 경로별 접근 권한 설정
        http.authorizeHttpRequests((authorize) ->
                authorize
                        .requestMatchers("/admin-members.html", "/admin_members", "/api/admin/**").authenticated()
                        .requestMatchers("/**").permitAll()
        );

        // 3. 폼 로그인 규격 및 성공/실패 처리 설정
        http.formLogin((form) -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .usernameParameter("userid")   // HTML의 name="userid"와 일치
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error=true")
        );

        // 4. 로그아웃 설정
        http.logout((logout) -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .deleteCookies("JSESSIONID")
        );

        // 5. [추가] 예외 처리 (미인증 401 및 권한 부족 403 처리)
        http.exceptionHandling((exception) -> exception
                // 5-1. 미인증 유저(로그인 안 한 사용자) 처리
                .authenticationEntryPoint((request, response, authException) -> {
                    String requestUri = request.getRequestURI();
                    if (requestUri.startsWith("/api/")) {
                        // API 요청인 경우 JSON 401 응답
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\":false, \"message\":\"로그인이 필요합니다.\"}");
                    } else {
                        // 일반 페이지 요청인 경우 로그인 페이지로 이동
                        response.sendRedirect("/login");
                    }
                })
                // 5-2. 권한 부족 유저 처리
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    String requestUri = request.getRequestURI();
                    if (requestUri.startsWith("/api/")) {
                        // API 요청인 경우 JSON 403 응답
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\":false, \"message\":\"접근 권한이 없습니다.\"}");
                    } else {
                        // 일반 페이지 요청인 경우 메인 페이지로 이동
                        response.sendRedirect("/");
                    }
                })
        );

        return http.build();
    }
}