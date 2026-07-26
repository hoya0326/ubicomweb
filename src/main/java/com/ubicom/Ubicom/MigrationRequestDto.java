package com.ubicom.Ubicom;

import java.util.List;

public class MigrationRequestDto {

    private String userId;
    private List<PostMigrationDto> posts;
    private List<CommentMigrationDto> comments;

    // Getters & Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public List<PostMigrationDto> getPosts() { return posts; }
    public void setPosts(List<PostMigrationDto> posts) { this.posts = posts; }

    public List<CommentMigrationDto> getComments() { return comments; }
    public void setComments(List<CommentMigrationDto> comments) { this.comments = comments; }

    // 내부 DTO: 게시글
    public static class PostMigrationDto {
        private String title;
        private String content;
        private boolean isAnonymous;
        private int views;
        private String createdAt;
        private String updatedAt;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public boolean isAnonymous() { return isAnonymous; }
        public void setAnonymous(boolean anonymous) { isAnonymous = anonymous; }

        public int getViews() { return views; }
        public void setViews(int views) { this.views = views; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    }

    // 내부 DTO: 댓글
    public static class CommentMigrationDto {
        private String postId;
        private String content;
        private boolean isAnonymous;
        private String createdAt;

        public String getPostId() { return postId; }
        public void setPostId(String postId) { this.postId = postId; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public boolean isAnonymous() { return isAnonymous; }
        public void setAnonymous(boolean anonymous) { isAnonymous = anonymous; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }
}