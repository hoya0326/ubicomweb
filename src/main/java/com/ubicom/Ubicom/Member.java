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

    @Column(name = "EMAIL", length = 100)
    public String email;

    @Column(length = 20)
    public String phone;

    public String role = "USER";
}