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
        // 1. CSRF 비활성화 (프론트엔드 연동 유지)
        http.csrf((csrf) -> csrf.disable());

        // 2. 경로별 접근 권한 설정
        http.authorizeHttpRequests((authorize) ->
                authorize
                        .requestMatchers("/admin-members.html", "/admin_members", "/api/admin/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                        .requestMatchers("/**").permitAll()
        );

        // 3. 폼 로그인 설정
        http.formLogin((form) -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .usernameParameter("userid")
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error=true")
                .permitAll()
        );

        // 4. 로그아웃 설정
        http.logout((logout) -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .deleteCookies("JSESSIONID")
                .permitAll()
        );

        // 5. 🛡️ [추가] 세션 관리 강화 (중복 로그인 제어 및 세션 고정 공격 방어)
        http.sessionManagement((session) -> session
                .maximumSessions(1) // 동일 계정으로 동시 로그인 가능한 세션 수 1개로 제한 (크래킹/공유 방지)
                .maxSessionsPreventsLogin(false) // false인 경우 기존 사용자의 세션을 만료시키고 새 로그인 허용 (true면 새 로그인 차단)
        );

        // 6. 예외 처리 (미인증 401 및 권한 부족 403 처리)
        http.exceptionHandling((exception) -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    String requestUri = request.getRequestURI();
                    if (requestUri.startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\":false, \"message\":\"로그인이 필요합니다.\"}");
                    } else {
                        response.sendRedirect("/login");
                    }
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    String requestUri = request.getRequestURI();
                    if (requestUri.startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\":false, \"message\":\"접근 권한이 없습니다.\"}");
                    } else {
                        response.sendRedirect("/");
                    }
                })
        );

        return http.build();
    }
}