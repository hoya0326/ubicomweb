package com.ubicom.Ubicom.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ubicom.Ubicom.Entity.Post;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class PostResponseDto {

    private Long id;
    private String title;
    private String content;

    // 화면에 표시할 작성자명
    private String authorName;

    // 현재 로그인 사용자가 작성자인지
    private boolean mine;

    // 현재 사용자가 수정·삭제 가능한지
    private boolean canManage;

    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    @JsonProperty("isSecret")
    private boolean isSecret;

    @JsonProperty("isPinned")
    private boolean isPinned;

    private int views;
    private int commentsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostResponseDto from(
            Post post,
            Integer currentUserId,
            boolean admin) {

        PostResponseDto dto = new PostResponseDto();

        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setAnonymous(post.isAnonymous());
        dto.setSecret(post.isSecret());
        dto.setPinned(post.isPinned());
        dto.setViews(post.getViews());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());

        boolean mine = post.getAuthor() != null
                && currentUserId != null
                && currentUserId.equals(post.getAuthor().getUserId());

        dto.setMine(mine);
        dto.setCanManage(mine || admin);

        if (post.getAuthor() == null) {
            dto.setAuthorName("알 수 없음");
        } else if (post.isAnonymous()) {
            dto.setAuthorName("익명");
        } else {
            String name = post.getAuthor().getName();

            if (name == null || name.isBlank()) {
                dto.setAuthorName("알 수 없음");
            } else {
                dto.setAuthorName(name);
            }
        }

        return dto;
    }

    public static PostResponseDto from(Post post) {
        return from(post, null, false);
    }
}