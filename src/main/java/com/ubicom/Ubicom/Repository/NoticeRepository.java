package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    // 최신 작성순 정렬 목록 조회
    List<Notice> findAllByOrderByIdDesc();
}