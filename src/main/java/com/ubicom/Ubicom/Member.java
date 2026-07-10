package com.ubicom.Ubicom;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String name;

    @Column(unique = true)
    public Integer userId;
    public String major;
    public String password;

    // 💡 [추가] 유저의 권한을 저장할 필드 (기본값은 일반 유저인 "USER"로 세팅)
    public String role = "USER";
}