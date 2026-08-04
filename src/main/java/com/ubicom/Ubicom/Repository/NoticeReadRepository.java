package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.NoticeRead;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticeReadRepository extends JpaRepository<NoticeRead, Long> {
    // 특정 유저가 읽은 기록 목록 조회
    List<NoticeRead> findByUserId(String userId);

    // 특정 유저가 해당 공지사항을 읽었는지 여부 확인
    boolean existsByUserIdAndNoticeId(String userId, Long noticeId);
}