package com.ubicom.Ubicom.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedules")
@Getter
@Setter
@NoArgsConstructor
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String category; // 'event' (학술/스터디), 'club' (동아리 활동)

    @Column(nullable = false)
    private String recurrence; // 'none', 'weekly', 'monthly', 'yearly'

    private LocalDate recurrenceEnd;

    // 반복 일정 중 삭제/제외 처리된 날짜들의 목록 (Comma-separated String 또는 ElementCollection)
    @ElementCollection
    @CollectionTable(name = "schedule_exceptions", joinColumns = @JoinColumn(name = "schedule_id"))
    @Column(name = "exception_date")
    private List<String> exceptions = new ArrayList<>();

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.recurrence == null) this.recurrence = "none";
        if (this.category == null) this.category = "event";
    }
}