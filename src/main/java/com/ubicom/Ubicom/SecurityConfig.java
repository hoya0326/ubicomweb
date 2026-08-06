package com.ubicom.Ubicom;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
    public SecurityFilterChain filterChain(HttpSecurity http)
            throws Exception {

        // 현재 프론트엔드 방식 유지를 위해 CSRF 비활성화
        http.csrf(csrf -> csrf.disable());

        http.authorizeHttpRequests(authorize ->
                authorize

                        // 관리자 전용 경로
                        .requestMatchers(
                                "/admin-members.html",
                                "/admin_members",
                                "/api/admin/**"
                        )
                        .hasAnyAuthority("ADMIN", "ROLE_ADMIN")

                        // 게시글 작성·수정·삭제는 로그인 필수
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/posts/**"
                        )
                        .authenticated()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/posts/**"
                        )
                        .authenticated()

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/posts/**"
                        )
                        .authenticated()

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/posts/**"
                        )
                        .authenticated()

                        // 게시글 조회는 기존 동작 유지
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/posts/**"
                        )
                        .permitAll()

                        // 나머지 기존 경로는 일단 허용
                        .requestMatchers("/**")
                        .permitAll()
        );

        http.formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .usernameParameter("userid")
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error=true")
                .permitAll()
        );

        http.logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .deleteCookies("JSESSIONID")
                .permitAll()
        );

        http.sessionManagement(session -> session
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
        );

        http.exceptionHandling(exception -> exception

                .authenticationEntryPoint(
                        (request, response, authException) -> {

                            String requestUri =
                                    request.getRequestURI();

                            if (requestUri.startsWith("/api/")) {
                                response.setStatus(
                                        HttpServletResponse
                                                .SC_UNAUTHORIZED
                                );

                                response.setContentType(
                                        "application/json;charset=UTF-8"
                                );

                                response.getWriter().write(
                                        "{\"success\":false,"
                                                + "\"message\":\"로그인이 필요합니다.\"}"
                                );
                            } else {
                                response.sendRedirect("/login");
                            }
                        }
                )

                .accessDeniedHandler(
                        (request, response, accessDeniedException) -> {

                            String requestUri =
                                    request.getRequestURI();

                            if (requestUri.startsWith("/api/")) {
                                response.setStatus(
                                        HttpServletResponse
                                                .SC_FORBIDDEN
                                );

                                response.setContentType(
                                        "application/json;charset=UTF-8"
                                );

                                response.getWriter().write(
                                        "{\"success\":false,"
                                                + "\"message\":\"접근 권한이 없습니다.\"}"
                                );
                            } else {
                                response.sendRedirect("/");
                            }
                        }
                )
        );

        return http.build();
    }
}