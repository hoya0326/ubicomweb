package com.ubicom.Ubicom;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PollRepository extends JpaRepository<Poll, Long> {
    // 별도의 쿼리 작성 필요 없음
}