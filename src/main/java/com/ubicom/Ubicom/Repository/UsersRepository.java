package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Long> {
    // ⭕ 올바른 예시 (파라미터 바인딩)
    @Query("SELECT m FROM Member m WHERE m.userId = :userId")
    Optional<Users> findByUserId(Integer userId);
    Optional<Users> findById(Long id);
    boolean existsByUserId(Integer userId);
}
