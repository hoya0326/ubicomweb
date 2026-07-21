package com.ubicom.Ubicom;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "users")
@ToString
@Getter
@Setter
public class Users{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "my_row_id")
    public Long id;

    @Column(name = "USERID", nullable = false)
    public Integer userId;

    @Column(name = "NAME", nullable = false)
    public String name;

    @Column(name = "GENDER", nullable = false)
    public String gender;

    @Column(name = "MAJOR", nullable = false)
    public String major;

    @Column(name = "PHONE")
    public String phone;

    @Column(name = "EMAIL", length = 100)
    public String email;

    // getter/setter



}