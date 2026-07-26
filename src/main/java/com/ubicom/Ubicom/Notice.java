package com.ubicom.Ubicom;

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

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // DB의 view_count 컬럼과 매핑 및 기본값 0 설정
    @Column(name = "view_count", nullable = false)
    private Integer views = 0;

    public void incrementViews() {
        if (this.views == null) {
            this.views = 0;
        }
        this.views++;
    }
}