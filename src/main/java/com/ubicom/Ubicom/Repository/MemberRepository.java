package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    // ⭕ 올바른 예시 (파라미터 바인딩)
    @Query("SELECT m FROM Member m WHERE m.userId = :userId")
    Optional<Member> findByUserId(Integer userId);

    boolean existsByUserId(Integer userId);
}