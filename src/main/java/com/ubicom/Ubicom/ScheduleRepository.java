package com.ubicom.Ubicom;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    // 1. 시작일 오름차순으로 전체 일정 조회 (에러 해결용 추가)
    List<Schedule> findAllByOrderByStartDateAsc();

    // 2. 카테고리별 일정 조회 (예: 학사일정만 또는 동아리일정만)
    List<Schedule> findByCategory(String category);

    // 3. 특정 기간 내 시작되는 일정 조회
    List<Schedule> findByStartDateBetween(LocalDate start, LocalDate end);
}