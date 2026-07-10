package com.ubicom.Ubicom;

import com.ubicom.Ubicom.Member;
import com.ubicom.Ubicom.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Integer adminId = 20233244;

        if (memberRepository.findByUserId(adminId).isEmpty()) {

            Member admin = new Member();
            admin.setUserId(adminId);
            admin.setName("관리자");
            admin.setMajor("정보보안학과");
            admin.setPassword(passwordEncoder.encode("admin"));

            // ⚠️ [수정 포인트] 이곳의 주석을 풀고 데이터베이스에 "ADMIN" 또는 "ROLE_ADMIN"이 들어가도록 설정합니다.
            // 엔티티 구조에 맞는 메서드명을 사용하세요. (예: admin.setRole("ADMIN");)
            admin.setRole("ADMIN");

            memberRepository.save(admin);
            System.out.println("=== [UbiCOM] 관리자 계정이 DB에 자동으로 생성되었습니다. (ID: 20233244) ===");
        }
    }
}