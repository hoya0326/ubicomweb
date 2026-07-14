package com.ubicom.Ubicom;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.io.IOException;
import java.io.PrintWriter;

@Controller
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/register")
    public String register() {
        return "forward:/register.html";
    }

    @PostMapping("/member")
    @Transactional
    public String addMember(
            String name,
            Integer userid,
            String major,
            String password,
            HttpServletResponse response
    ) throws Exception {

        var result = usersRepository.findByUserId(userid);
        var result2 = memberRepository.findByUserId(userid);

        // 1. 학번 자릿수 검증 (8자리)
        if (userid == null || (int)(Math.log10(userid) + 1) != 8) {
            showAlert(response, "학번 8자리를 정확히 입력해주세요.");
            return null;
        }

        // 2. 존재하지 않는 학번 검증
        if (result.isEmpty()) {
            showAlert(response, "존재하지 않는 학번입니다.");
            return null;
        }

        // 3. 이미 등록된 학번 검증
        if (result2.isPresent()) {
            showAlert(response, "이미 등록된 학번입니다.");
            return null;
        }

        // 회원 가입 진행
        Member member = new Member();
        member.setName(name);
        member.setUserId(userid);
        member.setMajor(major);

        var hash = passwordEncoder.encode(password);
        member.setPassword(hash);

        memberRepository.save(member);

        return "redirect:/";
    }

    private void showAlert(HttpServletResponse response, String message) throws IOException {
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<script>");
        out.println("alert('" + message + "');");
        out.println("location.href='/register';");
        out.println("</script>");
        out.flush();
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/login.html";
    }
}