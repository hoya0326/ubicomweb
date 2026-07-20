package com.ubicom.Ubicom;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestParam;

import org.springframework.web.bind.annotation.RequestParam;
import java.security.SecureRandom;

import java.io.IOException;
import java.io.PrintWriter;

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
            String name,
            Integer userid,
            String major,
            String password,
            String email,
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
        member.setEmail(email);

        var hash = passwordEncoder.encode(password);
        member.setPassword(hash);

        Users user = result.get();
        user.setEmail(email);
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
            return "redirect:/email-register";
        }

        return "redirect:/";
    }

    @GetMapping("/email-register")
    public String emailRegister(Authentication authentication) {

        if (authentication == null
                || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }

        return "forward:/email-register.html";
    }

    @PostMapping("/member/email")
    @Transactional
    public String saveEmail(
            Authentication authentication,
            @RequestParam String email,
            HttpServletResponse response
    ) throws IOException {

        if (authentication == null
                || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/login";
        }

        Integer userId = Integer.parseInt(authentication.getName());

        var memberResult = memberRepository.findByUserId(userId);
        var userResult = usersRepository.findByUserId(userId);

        if (memberResult.isEmpty() || userResult.isEmpty()) {
            showAlert(response, "회원 정보를 찾을 수 없습니다.");
            return null;
        }

        Member member = memberResult.get();
        Users user = userResult.get();

        member.setEmail(email);
        user.setEmail(email);

        memberRepository.save(member);
        usersRepository.save(user);

        return "redirect:/";
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


