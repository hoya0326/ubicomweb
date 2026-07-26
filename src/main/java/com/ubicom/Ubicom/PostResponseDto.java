package com.ubicom.Ubicom;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class PostResponseDto {
    private Long id;
    private String title;
    private String content;

    // 작성자 전체 정보 전달용 (이름, 학번 등)
    private AuthorDto author;
    private String authorName;

    // Jackson이 'anonymous' 대신 'isAnonymous' 키로 JSON 생성하도록 강제
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    private int views;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt; // 수정 여부 확인용 (없다면 삭제 가능)

    // 작성자 정보를 깔끔하게 묶어줄 내부 DTO
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
        dto.setAnonymous(post.isAnonymous()); // getter/setter 호출
        dto.setViews(post.getViews());
        dto.setCreatedAt(post.getCreatedAt());

        if (post.getUpdatedAt() != null) {
            dto.setUpdatedAt(post.getUpdatedAt());
        }

        // 작성자 객체 정보 세팅 (익명 여부와 상관없이 실제 작성자 정보를 채워둠)
        if (post.getAuthor() != null) {
            AuthorDto authorDto = new AuthorDto();
            authorDto.setUserId(post.getAuthor().getUserId());
            authorDto.setName(post.getAuthor().getName());
            authorDto.setUsername(post.getAuthor().getName());

            dto.setAuthor(authorDto);

            String realName = post.getAuthor().getName() != null ?
                    post.getAuthor().getName() : String.valueOf(post.getAuthor().getUserId());
            dto.setAuthorName(realName);
        } else {
            dto.setAuthorName("알 수 없음");
        }

        return dto;
    }
}