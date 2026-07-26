package com.ubicom.Ubicom;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class CommentResponseDto {
    private Long id;
    private String content;
    private String authorName;      // 일반 표시용 이름 ("익명" 또는 본명)
    private String realAuthorName;  // 관리자용 실명

    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    private LocalDateTime createdAt;

    public static CommentResponseDto from(Comment comment) {
        CommentResponseDto dto = new CommentResponseDto();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setAnonymous(comment.isAnonymous());
        dto.setCreatedAt(comment.getCreatedAt());

        // 실제 작성자 이름 추출
        String realName = "알 수 없음";
        if (comment.getAuthor() != null) {
            realName = comment.getAuthor().getName() != null ?
                    comment.getAuthor().getName() : String.valueOf(comment.getAuthor().getUserId());
        }
        dto.setRealAuthorName(realName);

        // 익명 여부에 따른 일반 표시용 이름 처리
        if (comment.isAnonymous()) {
            dto.setAuthorName("익명");
        } else {
            dto.setAuthorName(realName);
        }

        return dto;
    }
}