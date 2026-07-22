package com.ubicom.Ubicom;

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
        http.csrf((csrf) -> csrf.disable());
        http.authorizeHttpRequests((authorize) ->
                authorize.requestMatchers("/**").permitAll()
        );

        // 폼 로그인 규격 및 성공/실패 처리 설정
        http.formLogin((form) -> form
                .loginPage("/login.html")
                .loginProcessingUrl("/login")
                .usernameParameter("userid")  // ★ 이 줄을 반드시 추가해주세요! (HTML의 name="userid"와 일치시킴)
                .passwordParameter("password") // 기본값이 password이지만 명시적으로 적어주면 좋습니다.
                .defaultSuccessUrl("/", true)
                .failureUrl("/login.html?error=true")
        );

        // 로그아웃 설정 추가
        http.logout((logout) -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .deleteCookies("JSESSIONID")
        );
        return http.build();
    }
}