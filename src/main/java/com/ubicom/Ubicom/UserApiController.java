package com.ubicom.Ubicom;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UserApiController {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/api/user")
    public Map<String, Object> getCurrentUser(
            @AuthenticationPrincipal User principal,
            jakarta.servlet.http.HttpServletResponse response) {

        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1
        response.setHeader("Pragma", "no-cache"); // HTTP 1.0
        response.setHeader("Expires", "0"); // Proxies

        Map<String, Object> responseData = new HashMap<>();

        if (principal != null) {
            Integer userId = Integer.parseInt(principal.getUsername());
            var memberOpt = memberRepository.findByUserId(userId);

            if (memberOpt.isPresent()) {
                Member member = memberOpt.get();
                responseData.put("isLoggedIn", true);
                responseData.put("studentId", member.getUserId());
                responseData.put("username", member.getName());
                responseData.put("department", member.getMajor());

                // ✨ [수정] 하드코딩된 학번을 지우고, DB의 role이 "ADMIN"인지 판별하여 주입합니다.
                if (member.getRole() != null && "ADMIN".equalsIgnoreCase(member.getRole())) {
                    responseData.put("isAdmin", true);
                } else {
                    responseData.put("isAdmin", false);
                }

            } else {
                responseData.put("isLoggedIn", false);
            }
        } else {
            responseData.put("isLoggedIn", false);
        }

        return responseData;
    }

    @PostMapping("/api/user/profile")
    public Map<String, Object> updateProfile(
            @AuthenticationPrincipal User principal,
            @RequestParam String name,
            @RequestParam String department
    ) {
        Map<String, Object> responseData = new HashMap<>();

        if (principal == null) {
            responseData.put("success", false);
            responseData.put("message", "로그인이 필요합니다.");
            return responseData;
        }

        name = name.trim();
        department = department.trim();

        if (name.isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "이름을 입력해주세요.");
            return responseData;
        }

        if (department.isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "학과를 입력해주세요.");
            return responseData;
        }

        Integer userId = Integer.parseInt(principal.getUsername());
        var memberOpt = memberRepository.findByUserId(userId);

        if (memberOpt.isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "회원 정보를 찾을 수 없습니다.");
            return responseData;
        }

        Member member = memberOpt.get();
        member.setName(name);
        member.setMajor(department);

        memberRepository.save(member);

        responseData.put("success", true);
        responseData.put("message", "정보가 성공적으로 변경되었습니다.");
        responseData.put("username", member.getName());
        responseData.put("department", member.getMajor());

        return responseData;
    }

    @PostMapping("/api/user/password")
    public Map<String, Object> updatePassword(
            @AuthenticationPrincipal User principal,
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword
    ) {
        Map<String, Object> responseData = new HashMap<>();

        if (principal == null) {
            responseData.put("success", false);
            responseData.put("message", "로그인이 필요합니다.");
            return responseData;
        }

        if (currentPassword.isEmpty()
                || newPassword.isEmpty()
                || confirmPassword.isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "비밀번호 항목을 모두 입력해주세요.");
            return responseData;
        }

        if (newPassword.length() < 6) {
            responseData.put("success", false);
            responseData.put("message", "새 비밀번호는 6자 이상이어야 합니다.");
            return responseData;
        }

        if (!newPassword.equals(confirmPassword)) {
            responseData.put("success", false);
            responseData.put("message", "새 비밀번호가 서로 일치하지 않습니다.");
            return responseData;
        }

        Integer userId = Integer.parseInt(principal.getUsername());
        var memberOpt = memberRepository.findByUserId(userId);

        if (memberOpt.isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "회원 정보를 찾을 수 없습니다.");
            return responseData;
        }

        Member member = memberOpt.get();

        if (!passwordEncoder.matches(
                currentPassword,
                member.getPassword()
        )) {
            responseData.put("success", false);
            responseData.put("message", "현재 비밀번호가 일치하지 않습니다.");
            return responseData;
        }

        if (passwordEncoder.matches(
                newPassword,
                member.getPassword()
        )) {
            responseData.put("success", false);
            responseData.put("message", "현재 비밀번호와 다른 비밀번호를 입력해주세요.");
            return responseData;
        }

        String encodedPassword =
                passwordEncoder.encode(newPassword);

        member.setPassword(encodedPassword);
        memberRepository.save(member);

        responseData.put("success", true);
        responseData.put("message", "비밀번호가 성공적으로 변경되었습니다.");

        return responseData;
    }
}