package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Repository.ApplyRepository;
import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Repository.UsersRepository;
import com.ubicom.Ubicom.Entity.Apply;
import com.ubicom.Ubicom.Entity.Member;
import com.ubicom.Ubicom.Entity.Users;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.User;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class UserApiController {

    private final MemberRepository memberRepository;
    private final UsersRepository usersRepository;
    private final ApplyRepository applyRepository;
    private final PasswordEncoder passwordEncoder;

    // 관리자 권한 확인 헬퍼 메소드 (디버깅 로그 포함)
    private boolean checkAdmin(User principal) {
        if (principal == null) {
            System.out.println("🚨 [checkAdmin] principal이 null입니다. (로그인되지 않음)");
            return false;
        }
        try {
            System.out.println("🔍 [checkAdmin] 현재 로그인한 사용자 username(학번): " + principal.getUsername());
            Integer userId = Integer.parseInt(principal.getUsername());

            var memberOpt = memberRepository.findByUserId(userId);
            if (memberOpt.isEmpty()) {
                System.out.println("🚨 [checkAdmin] memberRepository에서 해당 학번(" + userId + ")의 회원 정보를 찾지 못했습니다.");
                return false;
            }

            Member member = memberOpt.get();
            String role = member.getRole();
            System.out.println("🔍 [checkAdmin] DB에서 조회된 회원 이름: " + member.getName() + ", Role 값: " + role);

            boolean isAdmin = role != null && (
                    "ADMIN".equalsIgnoreCase(role) ||
                            "ROLE_ADMIN".equalsIgnoreCase(role)
            );

            if (!isAdmin) {
                System.out.println("🚨 [checkAdmin] 권한 불일치: 현재 Role(" + role + ")은 관리자(ADMIN)가 아닙니다.");
            }

            return isAdmin;

        } catch (NumberFormatException e) {
            System.out.println("🚨 [checkAdmin] 학번 숫자로 변환 실패: " + principal.getUsername());
            return false;
        }
    }

    // ==========================================
    // 유저 / 인증 관련 API
    // ==========================================

    @PostMapping("/api/admin/users/add")
    public Map<String, Object> addApprovedUser(@RequestBody Users user) {
        Map<String, Object> responseData = new HashMap<>();

        if (usersRepository.findByUserId(user.getUserId() != null ? user.getUserId() : user.userId).isPresent()) {
            responseData.put("success", false);
            responseData.put("message", "이미 승인된 학번입니다.");
            return responseData;
        }

        if (user.getJoinedAt() == null) {
            user.setJoinedAt(LocalDateTime.now());
        }

        usersRepository.save(user);

        responseData.put("success", true);
        responseData.put("message", "승인 명단에 등록되었습니다.");

        return responseData;
    }

    @GetMapping({"/api/user", "/api/auth/me"})
    public Map<String, Object> getCurrentUser(
            @AuthenticationPrincipal User principal,
            HttpServletResponse response) {

        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");

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
                responseData.put("phone", member.getPhone());
                responseData.put("email", member.getEmail());

                if (member.getRole() != null && "ADMIN".equalsIgnoreCase(member.getRole())) {
                    responseData.put("isAdmin", true);
                    responseData.put("role", "ADMIN");
                } else {
                    responseData.put("isAdmin", false);
                    responseData.put("role", "USER");
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
            @RequestParam String department,
            @RequestParam String phone
    ) {
        Map<String, Object> responseData = new HashMap<>();

        if (principal == null) {
            responseData.put("success", false);
            responseData.put("message", "로그인이 필요합니다.");
            return responseData;
        }

        name = name.trim();
        department = department.trim();
        phone = phone.trim();

        if (name.isEmpty() || department.isEmpty() || phone.isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "모든 정보를 입력해주세요.");
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
        member.setPhone(phone);

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

        if (currentPassword.isEmpty() || newPassword.isEmpty() || confirmPassword.isEmpty()) {
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

        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            responseData.put("success", false);
            responseData.put("message", "현재 비밀번호가 일치하지 않습니다.");
            return responseData;
        }

        if (passwordEncoder.matches(newPassword, member.getPassword())) {
            responseData.put("success", false);
            responseData.put("message", "현재 비밀번호와 다른 비밀번호를 입력해주세요.");
            return responseData;
        }

        member.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(member);

        responseData.put("success", true);
        responseData.put("message", "비밀번호가 성공적으로 변경되었습니다.");

        return responseData;
    }

    // ==========================================
    // 지원서(Apply) 관련 API
    // ==========================================

    @PostMapping("/api/applies")
    public Map<String, Object> submitApply(@RequestBody @Validated Apply apply) {
        Map<String, Object> responseData = new HashMap<>();

        if (apply.getName() == null || apply.getName().trim().isEmpty() ||
                apply.getStudentId() == null ||
                apply.getPhone() == null || apply.getPhone().trim().isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "필수 입력 정보가 누락되었습니다.");
            return responseData;
        }

        if (apply.getStatus() == null) {
            apply.setStatus("pending");
        }
        apply.setSubmittedAt(LocalDateTime.now());

        applyRepository.save(apply);

        responseData.put("success", true);
        responseData.put("message", "지원서가 성공적으로 제출되었습니다.");
        return responseData;
    }

    @GetMapping("/api/admin/applies")
    public ResponseEntity<?> getAdminApplies(
            @AuthenticationPrincipal User principal,
            @RequestParam(value = "status", required = false) String status
    ) {
        if (!checkAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("message", "관리자 권한이 없습니다."));
        }

        List<Apply> list;
        if (status != null && !status.trim().isEmpty()) {
            list = applyRepository.findByStatus(status);
        } else {
            list = applyRepository.findAll();
        }

        return ResponseEntity.ok(list);
    }

    @PostMapping("/api/admin/applies/{id}/status")
    public Map<String, Object> updateApplyStatus(
            @AuthenticationPrincipal User principal,
            @PathVariable Long id,
            @RequestParam String status
    ) {
        Map<String, Object> responseData = new HashMap<>();

        if (!checkAdmin(principal)) {
            responseData.put("success", false);
            responseData.put("message", "관리자 권한이 없습니다.");
            return responseData;
        }

        var applyOpt = applyRepository.findById(id);
        if (applyOpt.isEmpty()) {
            responseData.put("success", false);
            responseData.put("message", "해당 지원서를 찾을 수 없습니다.");
            return responseData;
        }

        Apply apply = applyOpt.get();
        apply.setStatus(status);
        applyRepository.save(apply);

        if ("approved".equalsIgnoreCase(status) || "ACCEPTED".equalsIgnoreCase(status)) {
            try {
                Integer studentIdInt = Integer.parseInt(apply.getStudentId().trim());
                Optional<Users> existingUserOpt = usersRepository.findByUserId(studentIdInt);

                if (existingUserOpt.isEmpty()) {
                    Users approvedUser = new Users();
                    approvedUser.setUserId(studentIdInt);
                    approvedUser.setName(apply.getName());
                    approvedUser.setMajor(apply.getDepartment());
                    approvedUser.setGender(apply.getGender() != null ? apply.getGender() : "m");
                    approvedUser.setPhone(apply.getPhone());
                    approvedUser.setEmail(apply.getEmail());
                    approvedUser.setJoinedAt(LocalDateTime.now());

                    usersRepository.save(approvedUser);
                } else {
                    Users existingUser = existingUserOpt.get();
                    if (existingUser.getJoinedAt() == null) {
                        existingUser.setJoinedAt(LocalDateTime.now());
                        usersRepository.save(existingUser);
                    }
                }
            } catch (NumberFormatException e) {
                System.err.println("학번 변환 에러 (지원서 ID: " + id + "): " + e.getMessage());
            }
        }

        responseData.put("success", true);
        responseData.put("message", "지원서 상태가 변경되었습니다.");
        return responseData;
    }

    @PostMapping("/api/admin/applies/{id}/accept")
    public Map<String, Object> acceptApply(
            @AuthenticationPrincipal User principal,
            @PathVariable Long id
    ) {
        return updateApplyStatus(principal, id, "approved");
    }
}