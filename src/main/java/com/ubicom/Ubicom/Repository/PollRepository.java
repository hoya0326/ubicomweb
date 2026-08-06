package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PollRepository extends JpaRepository<Poll, Long> {
    Optional<Poll> findByNoticeId(Long noticeId);
}