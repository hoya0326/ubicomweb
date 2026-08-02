package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Apply;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApplyRepository extends JpaRepository<Apply, Long> {

    // 학번으로 지원서 존재 여부 확인 (중복 지원 체크용)
    Optional<Apply> findByStudentId(String studentId);

    // 처리 상태별 목록 조회 (예: 대기중인 pending 지원서만 조회)
    List<Apply> findByStatusOrderBySubmittedAtDesc(String status);

    // 최근 제출순 전체 목록 조회
    List<Apply> findAllByOrderBySubmittedAtDesc();

    List<Apply> findByStatus(String status);
}