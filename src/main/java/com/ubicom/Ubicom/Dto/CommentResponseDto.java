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
    private String authorName;

    private boolean mine;
    private boolean canManage;

    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    private LocalDateTime createdAt;

    public static CommentResponseDto from(
            Comment comment,
            Integer currentUserId,
            boolean admin) {

        CommentResponseDto dto = new CommentResponseDto();

        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setAnonymous(comment.isAnonymous());
        dto.setCreatedAt(comment.getCreatedAt());

        boolean mine = comment.getAuthor() != null
                && comment.getAuthor().getUserId() != null
                && currentUserId != null
                && currentUserId.equals(
                comment.getAuthor().getUserId()
        );

        dto.setMine(mine);
        dto.setCanManage(mine || admin);

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

    public static CommentResponseDto from(Comment comment) {
        return from(comment, null, false);
    }
}