package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.*;
import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Repository.UsersRepository;
import com.ubicom.Ubicom.Entity.Member; // 프로젝트 엔티티 패키지 위치에 맞게 확인 (Table or Entity)
import com.ubicom.Ubicom.Entity.Users;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.SecureRandom;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;
    private final EmailService emailService;
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/register")
    public String register() {
        return "forward:/register.html";
    }

    @PostMapping("/member")
    @Transactional
    public String addMember(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer userid,
            @RequestParam(required = false) String major,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String email,
            HttpServletResponse response
    ) throws Exception {

        // 1. 학번 자릿수 검증 (8자리)
        if (userid == null || (int)(Math.log10(userid) + 1) != 8) {
            showAlert(response, "학번 8자리를 정확히 입력해주세요.");
            return null;
        }

        var result = usersRepository.findByUserId(userid);
        var result2 = memberRepository.findByUserId(userid);

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

        // 회원 가입 진행 (웹 계정 생성)
        Member member = new Member();
        member.setName(name);
        member.setUserId(userid);
        member.setMajor(major);
        member.setPhone(phone);
        member.setEmail(email);

        var hash = passwordEncoder.encode(password);
        member.setPassword(hash);

        Users user = result.get();
        user.setEmail(email);

        // ⭕ [수정] 웹 회원가입 시 기존 수락일(joinedAt)을 덮어쓰지 않습니다.
        // 혹시라도 승인 과정에서 joinedAt이 비어있던 유저만 예외적으로 세팅합니다.
        if (user.getJoinedAt() == null) {
            user.setJoinedAt(LocalDateTime.now());
        }

        usersRepository.save(user);
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

    @GetMapping("/login-success")
    public String loginSuccess(Authentication authentication) {

        if (authentication == null
                || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }

        Integer userId = Integer.parseInt(authentication.getName());

        var memberResult = memberRepository.findByUserId(userId);

        if (memberResult.isEmpty()) {
            return "redirect:/login";
        }

        Member member = memberResult.get();

        if (member.getEmail() == null || member.getEmail().isBlank()) {
            return "redirect:/email";
        }

        return "redirect:/";
    }

    @GetMapping("/email")
    public String emailRegister(Authentication authentication) {

        if (authentication == null
                || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }

        return "forward:/email-register.html";
    }

    @PostMapping("/member/email")
    @ResponseBody
    @Transactional
    public ResponseEntity<?> saveEmail(
            Authentication authentication,
            @RequestParam String email
    ) {
        if (authentication == null
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        try {
            Integer userId = Integer.parseInt(authentication.getName());

            var memberResult = memberRepository.findByUserId(userId);
            var userResult = usersRepository.findByUserId(userId);

            if (memberResult.isEmpty() || userResult.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "회원 정보를 찾을 수 없습니다."));
            }

            Member member = memberResult.get();
            Users user = userResult.get();

            member.setEmail(email);
            user.setEmail(email);

            memberRepository.save(member);
            usersRepository.save(user);

            return ResponseEntity.ok(Map.of("success", true, "message", "이메일이 성공적으로 등록되었습니다."));

        } catch (Exception e) {
            // 예외 발생 시 콘솔에 정확한 에러 로그 출력 (디버깅용)
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "이미 등록된 이메일이거나 서버 오류가 발생했습니다."));
        }
    }

    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "forward:/forgot-password.html";
    }

    @PostMapping("/password/reset-temp")
    @Transactional
    public String resetTemporaryPassword(
            @RequestParam Integer userid,
            @RequestParam String email,
            HttpServletResponse response
    ) throws IOException {

        var memberResult = memberRepository.findByUserId(userid);

        if (memberResult.isEmpty()) {
            showAlertAndMove(
                    response,
                    "학번 또는 이메일이 일치하지 않습니다.",
                    "/forgot-password"
            );
            return null;
        }

        Member member = memberResult.get();

        if (member.getEmail() == null
                || !member.getEmail().equalsIgnoreCase(email.trim())) {
            showAlertAndMove(
                    response,
                    "학번 또는 이메일이 일치하지 않습니다.",
                    "/forgot-password"
            );
            return null;
        }

        String temporaryPassword = createTemporaryPassword();

        emailService.sendTemporaryPassword(
                member.getEmail(),
                temporaryPassword
        );

        member.setPassword(passwordEncoder.encode(temporaryPassword));
        memberRepository.save(member);

        showAlertAndMove(
                response,
                "임시 비밀번호를 이메일로 발송했습니다.",
                "/login"
        );

        return null;
    }

    private String createTemporaryPassword() {
        SecureRandom random = new SecureRandom();
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }

    private void showAlertAndMove(
            HttpServletResponse response,
            String message,
            String location
    ) throws IOException {

        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<script>");
        out.println("alert('" + message + "');");
        out.println("location.href='" + location + "';");
        out.println("</script>");
        out.flush();
    }
}