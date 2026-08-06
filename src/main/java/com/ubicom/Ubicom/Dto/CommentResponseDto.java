package com.ubicom.Ubicom.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ubicom.Ubicom.Entity.Comment;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CommentResponseDto {

    private Long id;
    private String content;

    // 화면에 표시할 작성자명
    // 익명 댓글이면 "익명", 일반 댓글이면 실제 이름
    private String authorName;

    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    private LocalDateTime createdAt;

    public static CommentResponseDto from(Comment comment) {
        CommentResponseDto dto = new CommentResponseDto();

        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setAnonymous(comment.isAnonymous());
        dto.setCreatedAt(comment.getCreatedAt());

        if (comment.getAuthor() == null) {
            dto.setAuthorName("알 수 없음");
        } else if (comment.isAnonymous()) {
            dto.setAuthorName("익명");
        } else {
            String name = comment.getAuthor().getName();

            if (name == null || name.isBlank()) {
                dto.setAuthorName("알 수 없음");
            } else {
                dto.setAuthorName(name);
            }
        }

        return dto;
    }
}