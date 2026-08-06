package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Dto.PostDto;
import com.ubicom.Ubicom.Dto.PostResponseDto;
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

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {



    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final CommentRepository commentRepository;

    public PostController(
            PostRepository postRepository,
            MemberRepository memberRepository,
            CommentRepository commentRepository) {

        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.commentRepository = commentRepository;
    }

    // 현재 로그인한 사용자의 학번 가져오기
    private Integer getCurrentUserId(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }

        try {
            return Integer.parseInt(authentication.getName());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // 현재 로그인 사용자가 관리자인지 확인
    private boolean isAdmin(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return false;
        }

        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role ->
                        "ADMIN".equalsIgnoreCase(role)
                                || "ROLE_ADMIN".equalsIgnoreCase(role)
                );
    }

    // 게시글 작성자인지 확인
    private boolean isAuthor(Post post, Integer currentUserId) {
        return post != null
                && post.getAuthor() != null
                && post.getAuthor().getUserId() != null
                && currentUserId != null
                && currentUserId.equals(post.getAuthor().getUserId());
    }

    // 게시글 응답 DTO 생성
    private PostResponseDto makeResponse(
            Post post,
            Authentication authentication) {

        Integer currentUserId = getCurrentUserId(authentication);
        boolean admin = isAdmin(authentication);

        PostResponseDto dto =
                PostResponseDto.from(post, currentUserId, admin);

        dto.setCommentsCount(
                (int) commentRepository.countByPostId(post.getId())
        );

        return dto;
    }

    // 1. 게시글 전체 목록 조회
    @GetMapping
    public ResponseEntity<List<PostResponseDto>> getAllPosts(
            Authentication authentication) {

        Integer currentUserId = getCurrentUserId(authentication);
        boolean admin = isAdmin(authentication);

        List<PostResponseDto> posts =
                postRepository.findAllByOrderByCreatedAtDesc()
                        .stream()
                        .map(post -> {
                            PostResponseDto dto =
                                    PostResponseDto.from(
                                            post,
                                            currentUserId,
                                            admin
                                    );

                            dto.setCommentsCount(
                                    (int) commentRepository.countByPostId(
                                            post.getId()
                                    )
                            );

                            return dto;
                        })
                        .collect(Collectors.toList());

        return ResponseEntity.ok(posts);
    }

    // 2. 게시글 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(
            @PathVariable Long id,
            Authentication authentication) {

        Post post = postRepository.findById(id).orElse(null);

        if (post == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("게시글을 찾을 수 없습니다.");
        }

        Integer currentUserId = getCurrentUserId(authentication);
        boolean admin = isAdmin(authentication);
        boolean author = isAuthor(post, currentUserId);

        // 비밀글은 작성자 또는 관리자만 조회 가능
        if (post.isSecret() && !author && !admin) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("비밀글은 작성자와 관리자만 볼 수 있습니다.");
        }

        post.setViews(post.getViews() + 1);
        Post savedPost = postRepository.save(post);

        return ResponseEntity.ok(
                makeResponse(savedPost, authentication)
        );
    }

    // 3. 게시글 등록
    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestBody PostDto dto,
            Authentication authentication) {

        Integer currentUserId = getCurrentUserId(authentication);

        if (currentUserId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Member author = memberRepository
                .findByUserId(currentUserId)
                .orElse(null);

        if (author == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("로그인 사용자 정보를 찾을 수 없습니다.");
        }

        if (dto.getTitle() == null
                || dto.getTitle().isBlank()
                || dto.getContent() == null
                || dto.getContent().isBlank()) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("제목과 내용을 입력해주세요.");
        }

        Post post = new Post();
        post.setTitle(dto.getTitle().trim());
        post.setContent(dto.getContent().trim());
        post.setAuthor(author);
        post.setAnonymous(dto.isAnonymous());
        post.setSecret(dto.isSecret());

        Post savedPost = postRepository.save(post);

        PostResponseDto responseDto =
                PostResponseDto.from(
                        savedPost,
                        currentUserId,
                        isAdmin(authentication)
                );

        responseDto.setCommentsCount(0);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(responseDto);
    }

    // 4. 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            @RequestBody PostDto dto,
            Authentication authentication) {

        Integer currentUserId = getCurrentUserId(authentication);

        if (currentUserId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Post post = postRepository.findById(id).orElse(null);

        if (post == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("게시글을 찾을 수 없습니다.");
        }

        boolean author = isAuthor(post, currentUserId);
        boolean admin = isAdmin(authentication);

        if (!author && !admin) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("게시글을 수정할 권한이 없습니다.");
        }

        if (dto.getTitle() == null
                || dto.getTitle().isBlank()
                || dto.getContent() == null
                || dto.getContent().isBlank()) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("제목과 내용을 입력해주세요.");
        }

        post.setTitle(dto.getTitle().trim());
        post.setContent(dto.getContent().trim());

        Post updatedPost = postRepository.save(post);

        return ResponseEntity.ok(
                makeResponse(updatedPost, authentication)
        );
    }

    // 5. 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long id,
            Authentication authentication) {

        Integer currentUserId = getCurrentUserId(authentication);

        if (currentUserId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Post post = postRepository.findById(id).orElse(null);

        if (post == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("게시글을 찾을 수 없습니다.");
        }

        boolean author = isAuthor(post, currentUserId);
        boolean admin = isAdmin(authentication);

        if (!author && !admin) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("게시글을 삭제할 권한이 없습니다.");
        }

        postRepository.delete(post);

        return ResponseEntity.ok().build();
    }

    // 6. 게시글 고정 상태 변경 - 관리자만 가능
    @PatchMapping("/{id}/pin")
    public ResponseEntity<?> updatePin(
            @PathVariable Long id,
            @RequestBody PostDto dto,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("관리자만 게시글을 고정할 수 있습니다.");
        }

        Post post =
                postRepository.findById(id)
                        .orElse(null);

        if (post == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("게시글을 찾을 수 없습니다.");
        }

        post.setPinned(dto.isPinned());

        Post updatedPost =
                postRepository.save(post);

        return ResponseEntity.ok(
                makeResponse(updatedPost, authentication)
        );
    }
}