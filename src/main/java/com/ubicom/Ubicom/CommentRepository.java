package com.ubicom.Ubicom;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // ★ 특정 게시글의 댓글 목록 조회 (작성일 내림차순 -> 최신 댓글이 최상단)
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);
}