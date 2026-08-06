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
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

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

        /*
         * 5번 취약점 해결
         * CSRF 보호 활성화
         *
         * 브라우저 JavaScript가 XSRF-TOKEN 쿠키를 읽어서
         * X-XSRF-TOKEN 헤더로 보내도록 설정
         */
        http.csrf(csrf -> csrf
                .csrfTokenRepository(
                        CookieCsrfTokenRepository.withHttpOnlyFalse()
                )
                .ignoringRequestMatchers("/login")
        );

        /*
         * 6번 취약점 해결
         * /** permitAll 제거
         * 공개 경로만 명시적으로 허용
         */
        http.authorizeHttpRequests(authorize ->
                authorize

                        // 로그인 없이 접근해야 하는 페이지
                        .requestMatchers(
                                "/login",
                                "/login.html",
                                "/register",
                                "/register.html",
                                "/forgot-password",
                                "/forgot-password.html",
                                "/404.html",
                                "/error",
                                "/favicon.ico",
                                "/",
                                "/index.html",
                                "/apply",
                                "/apply.html"
                        )
                        .permitAll()

                        // 정적 파일
                        .requestMatchers(
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/webjars/**"
                        )
                        .permitAll()

                        // 회원가입 및 비밀번호 재설정
                        .requestMatchers(
                                HttpMethod.POST,
                                "/member",
                                "/password/reset-temp"
                        )
                        .permitAll()

                        // CSRF 토큰 발급
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/csrf"
                        )
                        .permitAll()

                        // 관리자 페이지 및 관리자 API
                        .requestMatchers(
                                "/admin-members.html",
                                "/admin_members",
                                "/api/admin/**"
                        )
                        .hasAnyAuthority(
                                "ADMIN",
                                "ROLE_ADMIN"
                        )

                        // 게시글 조회는 로그인하지 않아도 허용할 경우 유지
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/posts/**"
                        )
                        .permitAll()

                        // 공지 조회 허용
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/notices/**"
                        )
                        .permitAll()

                        // 투표 조회 허용
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/polls/**"
                        )
                        .permitAll()

                        // 나머지는 로그인 필수
                        .anyRequest()
                        .authenticated()
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
                .logoutSuccessUrl("/login?logout=true")
                .deleteCookies(
                        "JSESSIONID",
                        "XSRF-TOKEN"
                )
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
                                        HttpServletResponse.SC_UNAUTHORIZED
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
                                        HttpServletResponse.SC_FORBIDDEN
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