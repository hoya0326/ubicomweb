package com.ubicom.Ubicom;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "applies")
@Getter @Setter
public class Apply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 회원이 로그인 후 지원할 수도 있으므로 연관관계 매핑 (선택 사항)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private Member user;

    // 기본 개인 정보
    @Column(nullable = false, length = 50)
    private String name;            // 이름

    @Column(nullable = false, length = 20)
    private String studentId;       // 학번 (8자리)

    @Column(nullable = false, length = 100)
    private String department;      // 학과

    @Column(nullable = false, length = 10)
    private String grade;           // 학년

    @Column(nullable = false, length = 10)
    private String gender;          // 성별 (m/f)

    @Column(nullable = false, length = 20)
    private String phone;           // 연락처 (010-XXXX-XXXX)

    @Column(nullable = false, length = 100)
    private String email;           // 이메일

    // 설문 및 가입 조건 항목
    @Column(nullable = false, length = 20)
    private String experience;      // 프로그래밍 경험 (none, beginner, intermediate, advanced)

    @Column(nullable = false, length = 10)
    private String previousMember;  // 이전 유비컴 가입 이력 (yes/no)

    @Column(nullable = false, length = 10)
    private String studentCouncil;  // 학생회 가입(예정) 여부 (yes/no)

    @Column(nullable = false, length = 10)
    private String otherClub;       // 타 과동아리 가입(예정) 여부 (yes/no)

    @Column(nullable = false, length = 50)
    private String referrer;        // 추천인

    // 텍스트 작성 항목
    @Column(columnDefinition = "TEXT", nullable = false)
    private String motivation;      // 지원 동기 (최대 500자)

    @Column(columnDefinition = "TEXT")
    private String extra;           // 추가하고 싶은 말 (선택)

    // 처리 상태 및 일시
    @Column(length = 20)
    private String status = "pending"; // 처리 상태 (pending, accepted, rejected 등)

    private LocalDateTime submittedAt = LocalDateTime.now();
}