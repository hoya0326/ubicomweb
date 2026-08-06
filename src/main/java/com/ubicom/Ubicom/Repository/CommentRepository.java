package com.ubicom.Ubicom.Repository;

import com.ubicom.Ubicom.Entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);

    // ✨ 특정 게시글의 댓글 개수 조회 메서드 추가
    long countByPostId(Long postId);
}