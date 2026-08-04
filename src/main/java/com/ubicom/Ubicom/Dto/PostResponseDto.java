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

    // 작성자 전체 정보 전달용
    private AuthorDto author;
    private String authorName;      // 일반 표시용 이름 ("익명" 또는 본명)
    private String realAuthorName;  // 관리자 및 본인용 실명

    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    @JsonProperty("isSecret")
    private boolean isSecret;

    private int views;
    private int commentsCount; // ✨ 댓글 개수 필드 추가!
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    public static class AuthorDto {
        private Integer userId;
        private String name;
        private String username;
    }

    public static PostResponseDto from(Post post) {
        PostResponseDto dto = new PostResponseDto();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setAnonymous(post.isAnonymous());
        dto.setSecret(post.isSecret());
        dto.setViews(post.getViews());
        dto.setCreatedAt(post.getCreatedAt());

        if (post.getUpdatedAt() != null) {
            dto.setUpdatedAt(post.getUpdatedAt());
        }

        if (post.getAuthor() != null) {
            AuthorDto authorDto = new AuthorDto();
            authorDto.setUserId(post.getAuthor().getUserId());
            authorDto.setName(post.getAuthor().getName());
            authorDto.setUsername(post.getAuthor().getName());
            dto.setAuthor(authorDto);

            String realName = post.getAuthor().getName() != null ?
                    post.getAuthor().getName() : String.valueOf(post.getAuthor().getUserId());

            dto.setRealAuthorName(realName);

            if (post.isAnonymous()) {
                dto.setAuthorName("익명");
            } else {
                dto.setAuthorName(realName);
            }
        } else {
            dto.setRealAuthorName("알 수 없음");
            dto.setAuthorName("알 수 없음");
        }

        return dto;
    }
}