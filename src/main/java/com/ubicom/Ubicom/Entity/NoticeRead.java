package com.ubicom.Ubicom.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notice_read", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "notice_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class NoticeRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "notice_id", nullable = false)
    private Long noticeId;

    public NoticeRead(String userId, Long noticeId) {
        this.userId = userId;
        this.noticeId = noticeId;
    }
}