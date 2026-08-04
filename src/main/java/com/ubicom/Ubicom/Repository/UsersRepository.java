package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Long> {

    // 💡 [수정] FROM Member m -> FROM Users u 로 변경해야 합니다!
    @Query("SELECT u FROM Users u WHERE u.userId = :userId")
    Optional<Users> findByUserId(Integer userId);

    Optional<Users> findById(Long id);

    boolean existsByUserId(Integer userId);
}