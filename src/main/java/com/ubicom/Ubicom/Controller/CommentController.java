package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Dto.CommentDto;
import com.ubicom.Ubicom.Dto.CommentResponseDto;
import com.ubicom.Ubicom.Entity.Comment;
import com.ubicom.Ubicom.Entity.Member;
import com.ubicom.Ubicom.Entity.Post;
import com.ubicom.Ubicom.Repository.CommentRepository;
import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Repository.PostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    private static final int ADMIN_USER_ID = 20233244;

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;

    public CommentController(
            CommentRepository commentRepository,
            PostRepository postRepository,
            MemberRepository memberRepository) {

        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
    }

    private Integer getCurrentUserId(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                authentication.getName()
        )) {
            return null;
        }

        try {
            return Integer.parseInt(
                    authentication.getName()
            );
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isAdmin(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return false;
        }

        Integer currentUserId =
                getCurrentUserId(authentication);

        if (currentUserId != null
                && currentUserId == ADMIN_USER_ID) {
            return true;
        }

        for (GrantedAuthority authority
                : authentication.getAuthorities()) {

            String role = authority.getAuthority();

            if ("ADMIN".equalsIgnoreCase(role)
                    || "ROLE_ADMIN".equalsIgnoreCase(role)) {
                return true;
            }
        }

        return false;
    }

    private boolean isAuthor(
            Comment comment,
            Integer currentUserId) {

        return comment != null
                && comment.getAuthor() != null
                && comment.getAuthor().getUserId() != null
                && currentUserId != null
                && currentUserId.equals(
                comment.getAuthor().getUserId()
        );
    }

    // 댓글 목록
    @GetMapping
    public ResponseEntity<List<CommentResponseDto>>
    getCommentsByPostId(
            @PathVariable Long postId,
            Authentication authentication) {

        Integer currentUserId =
                getCurrentUserId(authentication);

        boolean admin =
                isAdmin(authentication);

        List<CommentResponseDto> comments =
                commentRepository
                        .findByPostIdOrderByCreatedAtDesc(postId)
                        .stream()
                        .map(comment ->
                                CommentResponseDto.from(
                                        comment,
                                        currentUserId,
                                        admin
                                )
                        )
                        .collect(Collectors.toList());

        return ResponseEntity.ok(comments);
    }

    // 댓글 등록
    @PostMapping
    public ResponseEntity<?> createComment(
            @PathVariable Long postId,
            @RequestBody CommentDto dto,
            Authentication authentication) {

        Integer currentUserId =
                getCurrentUserId(authentication);

        if (currentUserId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        if (dto.getContent() == null
                || dto.getContent().isBlank()) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("댓글 내용을 입력해주세요.");
        }

        Post post =
                postRepository.findById(postId)
                        .orElse(null);

        if (post == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("게시글을 찾을 수 없습니다.");
        }

        Member author =
                memberRepository
                        .findByUserId(currentUserId)
                        .orElse(null);

        if (author == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("로그인 사용자 정보를 찾을 수 없습니다.");
        }

        Comment comment = new Comment();

        comment.setPost(post);
        comment.setAuthor(author);
        comment.setContent(dto.getContent().trim());
        comment.setAnonymous(dto.isAnonymous());
        comment.setCreatedAt(LocalDateTime.now());

        Comment savedComment =
                commentRepository.save(comment);

        CommentResponseDto responseDto =
                CommentResponseDto.from(
                        savedComment,
                        currentUserId,
                        isAdmin(authentication)
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(responseDto);
    }

    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication) {

        Integer currentUserId =
                getCurrentUserId(authentication);

        if (currentUserId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Comment comment =
                commentRepository.findById(commentId)
                        .orElse(null);

        if (comment == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("댓글을 찾을 수 없습니다.");
        }

        if (comment.getPost() == null
                || !postId.equals(
                comment.getPost().getId()
        )) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("해당 게시글의 댓글이 아닙니다.");
        }

        boolean author =
                isAuthor(comment, currentUserId);

        boolean admin =
                isAdmin(authentication);

        if (!author && !admin) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("댓글을 삭제할 권한이 없습니다.");
        }

        commentRepository.delete(comment);

        return ResponseEntity.ok().build();
    }
}