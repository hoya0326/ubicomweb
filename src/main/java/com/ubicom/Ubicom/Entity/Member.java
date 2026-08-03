package com.ubicom.Ubicom.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private Integer userId;

    private String major;
    private String password;

    @Column(name = "EMAIL", length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    private String role = "USER";


}