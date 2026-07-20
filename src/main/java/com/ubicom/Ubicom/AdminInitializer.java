package com.ubicom.Ubicom;

import com.ubicom.Ubicom.Member;
import com.ubicom.Ubicom.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

//@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 💡 관리자로 지정할 학번 리스트 (원하는 학번을 언제든 이곳에 추가할 수 있습니다)
        List<Integer> adminIds = List.of(20233244);

        for (Integer adminId : adminIds) {
            // 해당 학번의 관리자가 DB에 없는 경우에만 새로 생성
            if (memberRepository.findByUserId(adminId).isEmpty()) {
                Member admin = new Member();
                admin.setUserId(adminId);

                // 학번에 따른 관리자 이름 설정 (구분용)
                if (adminId == 20233244) {
                    admin.setName("관리자1");
                } else {
                    admin.setName("관리자2");
                }

                admin.setMajor("정보보안학과");
                // 기본 비밀번호는 "admin"으로 암호화하여 저장
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole("ADMIN");

                memberRepository.save(admin);
                System.out.println("=== [UbiCOM] 관리자 계정이 DB에 자동으로 생성되었습니다. (ID: " + adminId + ") ===");
            }
        }
    }
}