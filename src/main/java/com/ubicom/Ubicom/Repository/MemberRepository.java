package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByUserId(Integer userId);

    boolean existsByUserId(Integer userId);
}