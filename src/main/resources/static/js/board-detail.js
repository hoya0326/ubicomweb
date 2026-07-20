// Board detail page functionality

let currentPost = null;
let currentPostId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;
    
    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get('id');
    
    if (!currentPostId) {
        window.location.href = '/board';
        return;
    }
    
    loadPost();
    loadComments();
});

function loadPost() {
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => p.id === currentPostId);
    
    if (!post) {
        document.getElementById('post-content').innerHTML = `
            <div class="p-12 text-center">
                <p class="text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
                <button onclick="window.location.href='/board'" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                    게시판으로 돌아가기
                </button>
            </div>
        `;
        return;
    }
    
    currentPost = post;
    const user = getCurrentUser();
    const userIsAdmin = isAdmin();
    const canDelete = userIsAdmin || user.id === post.authorId;
    const displayAuthor = getDisplayAuthor(post, userIsAdmin);
    
    document.getElementById('post-content').innerHTML = `
        <div class="p-6">
            <div class="flex items-start justify-between gap-4 mb-4">
                <h1 class="text-3xl font-bold flex-1">${escapeHtml(post.title)}</h1>
                ${canDelete ? `
                    <button onclick="deletePost()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                        삭제
                    </button>
                ` : ''}
            </div>
            
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>${displayAuthor}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>${formatFullDate(post.createdAt)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span>조회 ${post.views || 0}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span>댓글 ${post.comments || 0}</span>
                </div>
            </div>
            
            <div class="prose max-w-none whitespace-pre-wrap">
                ${escapeHtml(post.content)}
            </div>
        </div>
    `;
}

function loadComments() {
    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    const comments = allComments.filter(c => c.postId === currentPostId);
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const user = getCurrentUser();
    
    const commentsSection = document.getElementById('comments-section');
    commentsSection.innerHTML = `
        <div class="p-6">
            <h2 class="text-xl font-bold mb-6">댓글 ${comments.length}개</h2>
            
            <!-- Comment Form -->
            <form id="comment-form" class="mb-6 space-y-4">
                <textarea 
                    id="comment-content"
                    rows="3"
                    placeholder="댓글을 입력하세요..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                ></textarea>
                <div class="flex justify-end">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors">
                        댓글 작성
                    </button>
                </div>
            </form>
            
            <!-- Comments List -->
            ${comments.length > 0 ? `
                <div class="border-t pt-6 space-y-4">
                    ${comments.map(comment => `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="flex items-start justify-between gap-4 mb-2">
                                <div class="flex items-center gap-2 text-sm">
                                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    <span class="font-medium">${escapeHtml(comment.author)}</span>
                                    <span class="text-gray-500">·</span>
                                    <span class="text-gray-500">${formatFullDate(comment.createdAt)}</span>
                                </div>
                                ${user.id === comment.authorId ? `
                                    <button onclick="deleteComment('${comment.id}')" class="text-red-600 hover:text-red-700 text-sm">
                                        삭제
                                    </button>
                                ` : ''}
                            </div>
                            <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(comment.content)}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Add comment form submit handler
    document.getElementById('comment-form').addEventListener('submit', handleAddComment);
}

function handleAddComment(e) {
    e.preventDefault();
    
    const content = document.getElementById('comment-content').value.trim();
    
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const comment = {
        id: Date.now().toString(),
        postId: currentPostId,
        content: content,
        author: user.username,
        authorId: user.id,
        createdAt: new Date().toISOString()
    };
    
    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    allComments.push(comment);
    localStorage.setItem('comments', JSON.stringify(allComments));
    
    // Update comment count in post
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const postIndex = posts.findIndex(p => p.id === currentPostId);
    if (postIndex !== -1) {
        posts[postIndex].comments = (posts[postIndex].comments || 0) + 1;
        localStorage.setItem('posts', JSON.stringify(posts));
    }
    
    // Reload comments and post
    loadPost();
    loadComments();
}

function deletePost() {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
        return;
    }
    
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const filteredPosts = posts.filter(p => p.id !== currentPostId);
    localStorage.setItem('posts', JSON.stringify(filteredPosts));
    
    // Delete all comments for this post
    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    const filteredComments = allComments.filter(c => c.postId !== currentPostId);
    localStorage.setItem('comments', JSON.stringify(filteredComments));
    
    window.location.href = '/board';
}

function deleteComment(commentId) {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    const filteredComments = allComments.filter(c => c.id !== commentId);
    localStorage.setItem('comments', JSON.stringify(filteredComments));
    
    // Update comment count in post
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const postIndex = posts.findIndex(p => p.id === currentPostId);
    if (postIndex !== -1 && posts[postIndex].comments > 0) {
        posts[postIndex].comments -= 1;
        localStorage.setItem('posts', JSON.stringify(posts));
    }
    
    // Reload comments and post
    loadPost();
    loadComments();
}

function getDisplayAuthor(post, userIsAdmin) {
    if (post.isAnonymous) {
        if (userIsAdmin) {
            return `익명 (${escapeHtml(post.author)})`;
        }
        return "익명";
    }
    return escapeHtml(post.author);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
