package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Dto.ScheduleDto;
import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Entity.Schedule;
import com.ubicom.Ubicom.Repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleApiController {

    private final ScheduleRepository scheduleRepository;
    private final MemberRepository memberRepository;

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

    // 1. 전체 일정 목록 조회 (Response DTO 적용)
    @GetMapping
    public ResponseEntity<?> getSchedules() {
        List<ScheduleDto.Response> list = scheduleRepository.findAll()
                .stream()
                .map(ScheduleDto.Response::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // 2. 일정 등록 (시간 파싱 적용)
    @PostMapping
    public ResponseEntity<?> addSchedule(@AuthenticationPrincipal User principal, @RequestBody ScheduleDto.Request dto) {
        if (!checkAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 없습니다."));
        }

        Schedule schedule = new Schedule();
        schedule.setTitle(dto.getTitle());
        schedule.setDescription(dto.getDescription());
        schedule.setStartDate(dto.getStartDate());
        if (dto.getStartTime() != null && !dto.getStartTime().isEmpty()) {
            schedule.setStartTime(LocalTime.parse(dto.getStartTime()));
        }

        schedule.setEndDate(dto.getEndDate());
        if (dto.getEndTime() != null && !dto.getEndTime().isEmpty()) {
            schedule.setEndTime(LocalTime.parse(dto.getEndTime()));
        }

        schedule.setCategory(dto.getCategory());
        schedule.setRecurrence(dto.getRecurrence());
        schedule.setRecurrenceEnd(dto.getRecurrenceEnd());

        scheduleRepository.save(schedule);
        return ResponseEntity.ok(Map.of("success", true, "message", "일정이 추가되었습니다."));
    }

    // 3. 일정 완전히 삭제
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

    // 4. 반복 일정 중 특정 날짜 제외 처리
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
        schedule.getExceptions().add(dateStr);
        scheduleRepository.save(schedule);

        return ResponseEntity.ok(Map.of("success", true, "message", "해당 날짜 일정이 제외되었습니다."));
    }
}