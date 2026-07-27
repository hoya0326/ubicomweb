package com.ubicom.Ubicom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PollOptionRepository extends JpaRepository<PollOption, Long> {
    // 기본적인 CRUD 메서드가 자동 지원됩니다.
}