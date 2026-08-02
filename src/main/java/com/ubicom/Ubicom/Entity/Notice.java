package com.ubicom.Ubicom.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notice")
@Getter
@Setter
@NoArgsConstructor
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String author;

    private boolean hasPoll; // 👈 투표 첨부 여부 필드

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "view_count", nullable = false)
    private Integer views = 0;

    // ✨ 이 메서드가 반드시 존재해야 합니다!
    public void incrementViews() {
        if (this.views == null) {
            this.views = 0;
        }
        this.views++;
    }

    @PrePersist
    public void prePersist() {
        if (this.views == null) {
            this.views = 0;
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}