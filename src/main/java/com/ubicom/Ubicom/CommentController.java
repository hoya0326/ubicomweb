package com.ubicom.Ubicom;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;

    public CommentController(CommentRepository commentRepository,
                             PostRepository postRepository,
                             MemberRepository memberRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
    }

    // 1. 특정 게시글의 댓글 목록 조회 (최신순 정렬)
    @GetMapping
    public ResponseEntity<?> getCommentsByPostId(@PathVariable Long postId) {
        List<CommentResponseDto> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(comments);
    }

    // 2. 댓글 등록 (익명 상태 반영)
    @PostMapping
    public ResponseEntity<?> createComment(@PathVariable Long postId, @RequestBody CommentDto dto) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }

        Member author = null;
        if (dto.getUserId() != null) {
            author = memberRepository.findByUserId(dto.getUserId()).orElse(null);
        }

        if (author == null) {
            author = memberRepository.findByUserId(20260001)
                    .orElseGet(() -> {
                        Member defaultMember = new Member();
                        defaultMember.setUserId(20260001);
                        defaultMember.setName("기본사용자");
                        return memberRepository.save(defaultMember);
                    });
        }

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setContent(dto.getContent());
        comment.setAnonymous(dto.isAnonymous()); // ★ 익명 선택 여부 저장
        comment.setCreatedAt(LocalDateTime.now());

        Comment savedComment = commentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(CommentResponseDto.from(savedComment));
    }

    // 3. 댓글 삭제
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long postId, @PathVariable Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("댓글을 찾을 수 없습니다.");
        }
        commentRepository.deleteById(commentId);
        return ResponseEntity.ok().build();
    }
}