package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByUserId(Integer userId);
    Optional<Users> findById(Long id);
    boolean existsByUserId(Integer userId);
}
