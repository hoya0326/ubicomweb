package com.ubicom.Ubicom;

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

    public PostController(PostRepository postRepository, MemberRepository memberRepository) {
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
    }

    // 1. 게시글 전체 목록 조회
    @GetMapping
    public ResponseEntity<List<PostResponseDto>> getAllPosts() {
        List<PostResponseDto> posts = postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(PostResponseDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    // 2. 게시글 단건 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }
        post.setViews(post.getViews() + 1);
        postRepository.save(post);
        return ResponseEntity.ok(PostResponseDto.from(post));
    }

    // 3. 게시글 등록
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

        Post savedPost = postRepository.save(post);
        return ResponseEntity.status(HttpStatus.CREATED).body(PostResponseDto.from(savedPost));
    }

    // ★ 4. 게시글 수정 (추가됨)
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody PostDto dto) {
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }

        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        Post updatedPost = postRepository.save(post);

        return ResponseEntity.ok(PostResponseDto.from(updatedPost));
    }

    // ★ 5. 게시글 삭제 (405 에러 해결 - 추가됨)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        if (!postRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }

        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}