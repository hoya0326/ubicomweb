package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Dto.PostDto;
import com.ubicom.Ubicom.Dto.PostResponseDto;
import com.ubicom.Ubicom.Repository.CommentRepository; // ✨ 추가
import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Repository.PostRepository;
import com.ubicom.Ubicom.Entity.Member;
import com.ubicom.Ubicom.Entity.Post;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {

    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final CommentRepository commentRepository; // ✨ 추가

    public PostController(PostRepository postRepository,
                          MemberRepository memberRepository,
                          CommentRepository commentRepository) { // ✨ 추가
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.commentRepository = commentRepository;
    }

    // 1. 게시글 전체 목록 조회
    @GetMapping
    public ResponseEntity<List<PostResponseDto>> getAllPosts() {
        List<PostResponseDto> posts = postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> {
                    PostResponseDto dto = PostResponseDto.from(post);
                    // ✨ 각 게시글의 댓글 개수 세팅
                    dto.setCommentsCount((int) commentRepository.countByPostId(post.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    // 2. 게시글 단건 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(
            @PathVariable Long id,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role) {

        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }

        // 🔒 비밀글 접근 제어 로직
        if (post.isSecret()) {
            boolean isAdmin = "ADMIN".equalsIgnoreCase(role) ||
                    "admin".equalsIgnoreCase(role) ||
                    "ROLE_ADMIN".equalsIgnoreCase(role) ||
                    "admin".equalsIgnoreCase(userId);

            boolean isAuthor = false;
            if (post.getAuthor() != null && userId != null) {
                String reqUserId = String.valueOf(userId).trim();
                String authorInternalId = String.valueOf(post.getAuthor().getId());
                String authorUserId = post.getAuthor().getUserId() != null ? String.valueOf(post.getAuthor().getUserId()) : "";
                String authorName = post.getAuthor().getName() != null ? post.getAuthor().getName() : "";

                if (reqUserId.equals(authorInternalId) || reqUserId.equals(authorUserId) || reqUserId.equals(authorName)) {
                    isAuthor = true;
                }
            }

            if (!isAdmin && !isAuthor) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("비밀글은 작성자와 관리자만 볼 수 있습니다.");
            }
        }

        post.setViews(post.getViews() + 1);
        postRepository.save(post);

        PostResponseDto dto = PostResponseDto.from(post);
        dto.setCommentsCount((int) commentRepository.countByPostId(post.getId())); // ✨ 댓글 개수 세팅
        return ResponseEntity.ok(dto);
    }

    // 💡 3. 게시글 등록
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody PostDto dto) {
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

        Post post = new Post();
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setAuthor(author);
        post.setAnonymous(dto.isAnonymous());
        post.setSecret(dto.isSecret());

        Post savedPost = postRepository.save(post);

        PostResponseDto responseDto = PostResponseDto.from(savedPost);
        responseDto.setCommentsCount(0); // 신규 작성글은 댓글 0개
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    // ★ 4. 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody PostDto dto) {
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }

        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        Post updatedPost = postRepository.save(post);

        PostResponseDto responseDto = PostResponseDto.from(updatedPost);
        responseDto.setCommentsCount((int) commentRepository.countByPostId(updatedPost.getId()));
        return ResponseEntity.ok(responseDto);
    }

    // ★ 5. 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        if (!postRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }

        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}