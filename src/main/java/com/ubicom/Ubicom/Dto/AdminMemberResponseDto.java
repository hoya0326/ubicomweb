package com.ubicom.Ubicom.Dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class AdminMemberResponseDto {
    private Long id;              // 고유 식별자 (PK)
    private String name;          // 이름
    private Integer studentId;    // 학번 (userId)
    private String department;    // 학과 (major)
    private String phone;         // 전화번호
    private String gender;        // 성별
    private boolean isAdmin;      // 관리자 여부
    private boolean isWebUser;    // 웹 가입 여부
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("joined_at")
    private LocalDateTime joinedAt; // 💡 핵심: users 테이블의 가입일
}