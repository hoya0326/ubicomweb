package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Entity.Member;
import com.ubicom.Ubicom.Entity.Users;
import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminMemberController {

    @Autowired
    private UsersRepository userRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 💡 하드코딩된 최고 관리자 리스트를 비워두거나 DB 권한(role) 기준으로 판단하도록 변경
    private final List<Integer> adminIds = List.of();

    // 💡 날짜 포맷터 선언 (yyyy-MM-dd HH:mm:ss)
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 1. 동아리원 목록 조회 API
     */
    @GetMapping("/members")
    public ResponseEntity<List<Map<String, Object>>> getAdminMembers() {
        List<Users> allUsers = userRepository.findAll();
        List<Member> allWebMembers = memberRepository.findAll();

        Map<Integer, Member> webMemberMap = allWebMembers.stream()
                .filter(m -> m.getUserId() != null)
                .collect(Collectors.toMap(
                        Member::getUserId,
                        m -> m,
                        (existing, replacement) -> existing
                ));

        List<Map<String, Object>> result = new ArrayList<>();

        for (Users user : allUsers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId() != null ? String.valueOf(user.getId()) : "0");
            map.put("name", user.getName());
            map.put("studentId", String.valueOf(user.getUserId()));
            map.put("department", user.getMajor());
            map.put("gender", user.getGender());
            map.put("phone", user.getPhone());

            String joinedAtStr = (user.getJoinedAt() != null)
                    ? user.getJoinedAt().format(DATE_FORMATTER)
                    : LocalDateTime.now().format(DATE_FORMATTER);

            map.put("joinedAt", joinedAtStr);
            map.put("joined_at", joinedAtStr);

            boolean isWeb = webMemberMap.containsKey(user.getUserId());
            map.put("isWebUser", isWeb);

            // ⭕ [수정] DB의 Member role이 "ADMIN"인지 여부로만 관리자 판단
            boolean isAdmin = false;
            if (isWeb) {
                Member webInfo = webMemberMap.get(user.getUserId());
                if (webInfo.getRole() != null && "ADMIN".equalsIgnoreCase(webInfo.getRole())) {
                    isAdmin = true;
                }
            }
            map.put("isAdmin", isAdmin);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 2. 동아리원 추가 API
     */
    @PostMapping("/members/add")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> addMember(@RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String name = payload.get("name");
            String studentIdStr = payload.get("studentId");
            String department = payload.get("department");
            String password = payload.get("password");
            String gender = payload.get("gender");
            String phone = payload.get("phone");

            if (name == null || name.trim().isEmpty() ||
                    studentIdStr == null || studentIdStr.trim().isEmpty() ||
                    department == null || department.trim().isEmpty() ||
                    password == null || password.trim().isEmpty()) {

                response.put("success", false);
                response.put("message", "필수 입력 항목(이름, 학번, 학과, 비밀번호)이 누락되었습니다.");
                return ResponseEntity.status(400).body(response);
            }

            Integer studentId = Integer.parseInt(studentIdStr.trim());

            boolean isUserExists = userRepository.existsByUserId(studentId);
            boolean isMemberExists = memberRepository.existsByUserId(studentId);

            if (isUserExists || isMemberExists) {
                response.put("success", false);
                response.put("message", "이미 존재하는 학번입니다.");
                return ResponseEntity.status(400).body(response);
            }

            Users newUser = new Users();
            newUser.setName(name.trim());
            newUser.setUserId(studentId);
            newUser.setMajor(department.trim());

            String finalGender = (gender != null && !gender.trim().isEmpty()) ? gender.trim().toLowerCase() : "m";
            newUser.setGender(finalGender);
            newUser.setPhone(phone != null ? phone.trim() : "");
            newUser.setJoinedAt(LocalDateTime.now());

            userRepository.save(newUser);

            Member newWebMember = new Member();
            newWebMember.setName(name.trim());
            newWebMember.setUserId(studentId);
            newWebMember.setMajor(department.trim());

            if (passwordEncoder == null) {
                throw new NullPointerException("Spring Security PasswordEncoder가 주입되지 않았습니다.");
            }
            newWebMember.setPassword(passwordEncoder.encode(password));

            // ⭕ [수정] 신규 등록 시 기본 권한은 USER로 부여
            newWebMember.setRole("USER");
            memberRepository.save(newWebMember);

            response.put("success", true);
            response.put("message", "성공적으로 추가되었습니다.");
            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "학번 형식이 잘못되었습니다. 숫자로만 입력해 주세요.");
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            System.err.println("=== MEMBER ADD CRITICAL ERROR ===");
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "서버 오류: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 3. 동아리원 삭제 API
     */
    @DeleteMapping("/members/delete/{id}")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> deleteMember(@PathVariable("id") String id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long targetId = Long.parseLong(id.trim());

            Optional<Users> userOpt = userRepository.findById(targetId);

            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "존재하지 않는 회원 정보입니다. (요청 ID: " + id + ")");
                return ResponseEntity.status(404).body(response);
            }

            Users user = userOpt.get();
            Integer studentId = user.getUserId();

            if (studentId != null) {
                memberRepository.findByUserId(studentId)
                        .ifPresent(memberRepository::delete);
            }

            userRepository.delete(user);

            response.put("success", true);
            response.put("message", "성공적으로 삭제되었습니다.");
            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "전송된 회원 식별자(ID) 형식이 올바르지 않습니다.");
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            System.err.println("=== MEMBER DELETE CRITICAL ERROR ===");
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "삭제 중 서버 오류 발생: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 4. 관리자 권한 토글 API
     */
    @PutMapping("/members/toggle-admin/{id}")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> toggleAdminPermission(@PathVariable("id") String id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long targetId = Long.parseLong(id.trim());

            Optional<Users> userOpt = userRepository.findById(targetId);

            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "존재하지 않는 회원 정보입니다.");
                return ResponseEntity.status(404).body(response);
            }

            Users user = userOpt.get();
            Integer studentId = user.getUserId();

            if (studentId == null) {
                response.put("success", false);
                response.put("message", "유저의 학번 정보가 누락되어 있습니다.");
                return ResponseEntity.status(400).body(response);
            }

            // ⭕ [핵심 수정] 20233244학번을 포함해 어떤 학번이든 관리자 권한 토글이 가능하도록 예외 처리 제거

            Optional<Member> memberOpt = memberRepository.findByUserId(studentId);

            if (!memberOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "웹 가입을 진행하지 않은 유저는 권한을 조작할 수 없습니다.");
                return ResponseEntity.status(400).body(response);
            }

            Member member = memberOpt.get();
            String currentRole = member.getRole();
            String newRole = "ADMIN".equalsIgnoreCase(currentRole) ? "USER" : "ADMIN";

            member.setRole(newRole);
            memberRepository.save(member);

            response.put("success", true);
            response.put("message", "권한이 성공적으로 수정되었습니다.");
            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "올바르지 않은 식별자 형식입니다.");
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "서버 오류: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 5. 동아리원 가입 신청 수락 API
     */
    @PutMapping("/members/approve/{id}")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> approveMember(@PathVariable("id") String id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long targetId = Long.parseLong(id.trim());
            Optional<Users> userOpt = userRepository.findById(targetId);

            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "존재하지 않는 회원 정보입니다.");
                return ResponseEntity.status(404).body(response);
            }

            Users user = userOpt.get();
            user.setJoinedAt(LocalDateTime.now());
            userRepository.save(user);

            response.put("success", true);
            response.put("message", "가입 신청이 수락되었으며 가입일이 등록되었습니다.");
            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "올바르지 않은 ID 형식입니다.");
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "서버 오류: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}