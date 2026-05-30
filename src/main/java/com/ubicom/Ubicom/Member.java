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
    public String Name;
    @Column(unique = true)
    public Integer userId;
    public String major;
    public String password;
}