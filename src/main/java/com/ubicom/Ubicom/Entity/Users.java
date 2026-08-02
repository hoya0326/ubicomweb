package com.ubicom.Ubicom.Entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat; // 👈 추가
import com.fasterxml.jackson.annotation.JsonProperty; // 👈 추가
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@ToString
@Getter
@Setter
public class Users {

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

    @Column(name = "joined_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @JsonProperty("joined_at")
    public LocalDateTime joinedAt; // 👈 2. 가입일 필드 추가

}