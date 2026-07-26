package com.ubicom.Ubicom;

import com.ubicom.Ubicom.MigrationRequestDto;
import com.ubicom.Ubicom.Comment;
import com.ubicom.Ubicom.Member;
import com.ubicom.Ubicom.Post;
import com.ubicom.Ubicom.CommentRepository;
import com.ubicom.Ubicom.MemberRepository;
import com.ubicom.Ubicom.PostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/migration")
public class MigrationController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;

    public MigrationController(PostRepository postRepository,
                               CommentRepository commentRepository,
                               MemberRepository memberRepository) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.memberRepository = memberRepository;
    }

    @PostMapping("/sync-localstorage")
    @Transactional
    public ResponseEntity<String> syncLocalStorage(@RequestBody MigrationRequestDto dto) {
        // 1. 사용자 검증 (String으로 넘어온 dto.getUserId()를 Integer/Long으로 파싱하여 조회)
        Member author = null;
        try {
            // dto.getUserId()가 숫자 형태의 문자열인 경우 Integer로 파싱하여 findByUserId 호출
            Integer userIdInt = Integer.parseInt(dto.getUserId());
            author = memberRepository.findByUserId(userIdInt)
                    .orElseGet(() -> memberRepository.findById(Long.valueOf(userIdInt))
                            .orElse(null));
        } catch (NumberFormatException e) {
            // 숫자로 변환할 수 없는 예외 처리
        }

        if (author == null) {
            return ResponseEntity.badRequest().body("유효하지 않은 사용자입니다. (userId: " + dto.getUserId() + ")");
        }

        // 2. 게시글 저장
        if (dto.getPosts() != null) {
            for (MigrationRequestDto.PostMigrationDto postDto : dto.getPosts()) {
                Post post = new Post();
                post.setTitle(postDto.getTitle());
                post.setContent(postDto.getContent());
                post.setAuthor(author);
                post.setAnonymous(postDto.isAnonymous());
                post.setViews(postDto.getViews());

                // ISO 날짜 문자열 파싱 처리
                if (postDto.getCreatedAt() != null) {
                    post.setCreatedAt(parseDateTime(postDto.getCreatedAt()));
                }
                if (postDto.getUpdatedAt() != null) {
                    post.setUpdatedAt(parseDateTime(postDto.getUpdatedAt()));
                }

                postRepository.save(post);
            }
        }

        // 3. 댓글 저장
        if (dto.getComments() != null) {
            for (MigrationRequestDto.CommentMigrationDto commentDto : dto.getComments()) {
                // postId가 숫자로 유효한 경우 연결
                try {
                    Long postId = Long.parseLong(commentDto.getPostId());
                    Post post = postRepository.findById(postId).orElse(null);

                    if (post != null) {
                        Comment comment = new Comment();
                        comment.setPost(post);
                        comment.setAuthor(author);
                        comment.setContent(commentDto.getContent());

                        if (commentDto.getCreatedAt() != null) {
                            comment.setCreatedAt(parseDateTime(commentDto.getCreatedAt()));
                        }

                        commentRepository.save(comment);
                    }
                } catch (NumberFormatException ignored) {
                    // 수동 마이그레이션 시 기존 로컬 임시 ID는 생략
                }
            }
        }

        return ResponseEntity.ok("마이그레이션 성공");
    }

    private LocalDateTime parseDateTime(String dateStr) {
        try {
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}