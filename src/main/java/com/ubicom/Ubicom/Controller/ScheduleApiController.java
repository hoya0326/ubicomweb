package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Entity.Schedule;
import com.ubicom.Ubicom.Repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleApiController {

    private final ScheduleRepository scheduleRepository; // 사용하는 서비스 또는 리포지토리명
    private final MemberRepository memberRepository;

    // 관리자 여부 확인 헬퍼
    private boolean checkAdmin(User principal) {
        if (principal == null) return false;
        try {
            Integer userId = Integer.parseInt(principal.getUsername());
            var memberOpt = memberRepository.findByUserId(userId);
            return memberOpt.isPresent() && "ADMIN".equalsIgnoreCase(memberOpt.get().getRole());
        } catch (Exception e) {
            return false;
        }
    }

    // 1. 전체 일정 목록 조회
    @GetMapping
    public ResponseEntity<?> getSchedules() {
        List<Schedule> list = scheduleRepository.findAll();
        return ResponseEntity.ok(list);
    }

    // 2. 일정 등록
    @PostMapping
    public ResponseEntity<?> addSchedule(@AuthenticationPrincipal User principal, @RequestBody Schedule schedule) {
        if (!checkAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 없습니다."));
        }
        scheduleRepository.save(schedule);
        return ResponseEntity.ok(Map.of("success", true, "message", "일정이 추가되었습니다."));
    }

    // 3. 일정 완전히 삭제 (DELETE /api/schedules/{id})
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(@AuthenticationPrincipal User principal, @PathVariable Long id) {
        if (!checkAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 없습니다."));
        }

        if (!scheduleRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "존재하지 않는 일정입니다."));
        }

        scheduleRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "일정이 DB에서 삭제되었습니다."));
    }

    // 4. 반복 일정 중 특정 날짜 제외 처리 (POST /api/schedules/{id}/exception)
    @PostMapping("/{id}/exception")
    public ResponseEntity<?> addExceptionDate(
            @AuthenticationPrincipal User principal,
            @PathVariable Long id,
            @RequestParam String dateStr
    ) {
        if (!checkAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 없습니다."));
        }

        var scheduleOpt = scheduleRepository.findById(id);
        if (scheduleOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "일정을 찾을 수 없습니다."));
        }

        Schedule schedule = scheduleOpt.get();
        // exceptions 리스트에 제외할 날짜 문자열 추가 (Entity 구조에 맞게 구현)
        schedule.getExceptions().add(dateStr);
        scheduleRepository.save(schedule);

        return ResponseEntity.ok(Map.of("success", true, "message", "해당 날짜 일정이 제외되었습니다."));
    }
}