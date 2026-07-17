package com.ubicom.Ubicom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    // 💡 관리자로 지정할 학번 목록을 일관되게 관리합니다.
    private final List<Integer> adminIds = List.of(20233244);

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
        String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        for (Users user : allUsers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId() != null ? String.valueOf(user.getId()) : "0");
            map.put("name", user.getName());
            map.put("studentId", String.valueOf(user.getUserId()));
            map.put("department", user.getMajor());
            map.put("gender", user.getGender());
            map.put("phone", user.getPhone());
            map.put("joinedAt", todayStr);

            boolean isWeb = webMemberMap.containsKey(user.getUserId());
            map.put("isWebUser", isWeb);

            boolean isAdmin = false;
            if (user.getUserId() != null && adminIds.contains(user.getUserId())) {
                isAdmin = true;
            } else if (isWeb) {
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

            boolean isUserExists = userRepository.findAll().stream()
                    .anyMatch(u -> studentId.equals(u.getUserId()));
            boolean isMemberExists = memberRepository.findAll().stream()
                    .anyMatch(m -> studentId.equals(m.getUserId()));

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

            userRepository.save(newUser);

            Member newWebMember = new Member();
            newWebMember.setName(name.trim());
            newWebMember.setUserId(studentId);
            newWebMember.setMajor(department.trim());

            if (passwordEncoder == null) {
                throw new NullPointerException("Spring Security PasswordEncoder가 주입되지 않았습니다.");
            }
            newWebMember.setPassword(passwordEncoder.encode(password));

            if (adminIds.contains(studentId)) {
                newWebMember.setRole("ADMIN");
            } else {
                newWebMember.setRole("USER");
            }
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

            Optional<Users> userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getId() != null && u.getId().equals(targetId))
                    .findFirst();

            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "존재하지 않는 회원 정보입니다. (요청 ID: " + id + ")");
                return ResponseEntity.status(404).body(response);
            }

            Users user = userOpt.get();
            Integer studentId = user.getUserId();

            if (studentId != null) {
                memberRepository.findAll().stream()
                        .filter(m -> studentId.equals(m.getUserId()))
                        .findFirst()
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
     * 4. 관리자 권한 토글 API (신규 추가 💥)
     */
    @PutMapping("/members/toggle-admin/{id}")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> toggleAdminPermission(@PathVariable("id") String id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long targetId = Long.parseLong(id.trim());

            Optional<Users> userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getId() != null && u.getId().equals(targetId))
                    .findFirst();

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

            // 시스템 관리자로 명시된 학번은 권한 해제를 금지합니다.
            if (adminIds.contains(studentId)) {
                response.put("success", false);
                response.put("message", "시스템으로 지정된 최고 관리자 계정은 권한을 해제할 수 없습니다.");
                return ResponseEntity.status(400).body(response);
            }

            Optional<Member> memberOpt = memberRepository.findAll().stream()
                    .filter(m -> studentId.equals(m.getUserId()))
                    .findFirst();

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
}