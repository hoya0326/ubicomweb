package com.ubicom.Ubicom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    // 특정 투표(Poll)에서 특정 유저(userId)가 한 투표 목록 조회
    List<Vote> findByPollIdAndUserId(Long pollId, String userId);

    // 💡 JPQL을 이용해 해당 투표와 유저의 데이터를 데이터베이스에서 즉시 직접 삭제
    @Modifying
    @Query("DELETE FROM Vote v WHERE v.poll.id = :pollId AND v.userId = :userId")
    void deleteByPollIdAndUserId(@Param("pollId") Long pollId, @Param("userId") String userId);
}