// Board detail page functionality

let currentPost = null;
let currentPostId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof requireLogin === 'function' && !requireLogin()) return;

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

// ✨ 작성자 본인 여부를 다각도로 체크하는 헬퍼 함수
function isAuthorOrAdmin(post) {
    if (!post) return false;

    // 1. 관리자 체크
    const userIsAdmin = typeof isAdmin === 'function' ? isAdmin() : false;
    if (userIsAdmin) return true;

    // 2. 현재 로그인 사용자 가져오기
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) return false;

    // 3. ID, StudentId, Username 등 가용 가능한 식별값들을 비교
    const currentUserId = String(user.id || user.studentId || user.username || '');
    const postAuthorId = String(post.authorId || post.studentId || post.author || '');

    // 사용자 정보나 게시글 정보에 ID가 존재하는 경우 비교
    if (currentUserId && postAuthorId) {
        if (currentUserId === postAuthorId) return true;
    }

    // 이름(username) 기반 보조 검증 (익명이 아닌 경우)
    if (user.username && post.author && user.username === post.author) {
        return true;
    }

    return false;
}

function loadPost() {
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => String(p.id) === String(currentPostId));

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
    const userIsAdmin = typeof isAdmin === 'function' ? isAdmin() : false;

    // ✨ 보완된 본인/관리자 권한 판별 함수 적용
    const canManage = isAuthorOrAdmin(post);
    const displayAuthor = getDisplayAuthor(post, userIsAdmin);

    document.getElementById('post-content').innerHTML = `
        <div class="p-6">
            <div class="flex items-start justify-between gap-4 mb-4">
                <h1 class="text-3xl font-bold flex-1">${escapeHtml(post.title)}</h1>
                ${canManage ? `
                    <div class="flex items-center gap-2">
                        <button onclick="renderEditForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                            수정
                        </button>
                        <button onclick="deletePost()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                            삭제
                        </button>
                    </div>
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
                    <span>${typeof formatFullDate === 'function' ? formatFullDate(post.createdAt) : post.createdAt.split('T')[0]}</span>
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
            
            <div class="prose max-w-none whitespace-pre-wrap">${escapeHtml(post.content)}</div>
        </div>
    `;
}

// 게시글 수정 폼 렌더링
function renderEditForm() {
    if (!currentPost) return;

    document.getElementById('post-content').innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-bold mb-4">게시글 수정</h2>
            <form id="edit-post-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input 
                        type="text" 
                        id="edit-title" 
                        value="${escapeHtml(currentPost.title)}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        required
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <textarea 
                        id="edit-content" 
                        rows="10" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        required
                    >${escapeHtml(currentPost.content)}</textarea>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="button" onclick="loadPost()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm transition-colors">
                        취소
                    </button>
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                        저장
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('edit-post-form').addEventListener('submit', handleUpdatePost);
}

// 게시글 수정 저장
function handleUpdatePost(e) {
    e.preventDefault();

    if (!isAuthorOrAdmin(currentPost)) {
        alert('수정 권한이 없습니다.');
        return;
    }

    const updatedTitle = document.getElementById('edit-title').value.trim();
    const updatedContent = document.getElementById('edit-content').value.trim();

    if (!updatedTitle || !updatedContent) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }

    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const postIndex = posts.findIndex(p => String(p.id) === String(currentPostId));

    if (postIndex !== -1) {
        posts[postIndex].title = updatedTitle;
        posts[postIndex].content = updatedContent;
        posts[postIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('posts', JSON.stringify(posts));

        loadPost();
    }
}

function loadComments() {
    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    const comments = allComments.filter(c => String(c.postId) === String(currentPostId));
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const commentsSection = document.getElementById('comments-section');
    if (!commentsSection) return;

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
                    ${comments.map(comment => {
        const canDeleteComment = isAuthorOrAdmin(comment);
        return `
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="flex items-start justify-between gap-4 mb-2">
                                    <div class="flex items-center gap-2 text-sm">
                                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                        <span class="font-medium">${escapeHtml(comment.author)}</span>
                                        <span class="text-gray-500">·</span>
                                        <span class="text-gray-500">${typeof formatFullDate === 'function' ? formatFullDate(comment.createdAt) : comment.createdAt.split('T')[0]}</span>
                                    </div>
                                    ${canDeleteComment ? `
                                        <button onclick="deleteComment('${comment.id}')" class="text-red-600 hover:text-red-700 text-sm transition-colors">
                                            삭제
                                        </button>
                                    ` : ''}
                                </div>
                                <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(comment.content)}</p>
                            </div>
                        `;
    }).join('')}
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('comment-form').addEventListener('submit', handleAddComment);
}

function handleAddComment(e) {
    e.preventDefault();

    const content = document.getElementById('comment-content').value.trim();
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }

    const comment = {
        id: Date.now().toString(),
        postId: currentPostId,
        content: content,
        author: user.username,
        authorId: user.id || user.studentId || user.username,
        createdAt: new Date().toISOString()
    };

    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    allComments.push(comment);
    localStorage.setItem('comments', JSON.stringify(allComments));

    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const postIndex = posts.findIndex(p => String(p.id) === String(currentPostId));
    if (postIndex !== -1) {
        posts[postIndex].comments = (posts[postIndex].comments || 0) + 1;
        localStorage.setItem('posts', JSON.stringify(posts));
    }

    loadPost();
    loadComments();
}

function deletePost() {
    if (!isAuthorOrAdmin(currentPost)) {
        alert('삭제 권한이 없습니다.');
        return;
    }

    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const filteredPosts = posts.filter(p => String(p.id) !== String(currentPostId));
    localStorage.setItem('posts', JSON.stringify(filteredPosts));

    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    const filteredComments = allComments.filter(c => String(c.postId) !== String(currentPostId));
    localStorage.setItem('comments', JSON.stringify(filteredComments));

    window.location.href = '/board';
}

function deleteComment(commentId) {
    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    const targetComment = allComments.find(c => String(c.id) === String(commentId));

    if (!targetComment) return;

    if (!isAuthorOrAdmin(targetComment)) {
        alert('댓글을 삭제할 권한이 없습니다.');
        return;
    }

    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    const filteredComments = allComments.filter(c => String(c.id) !== String(commentId));
    localStorage.setItem('comments', JSON.stringify(filteredComments));

    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const postIndex = posts.findIndex(p => String(p.id) === String(currentPostId));
    if (postIndex !== -1 && posts[postIndex].comments > 0) {
        posts[postIndex].comments -= 1;
        localStorage.setItem('posts', JSON.stringify(posts));
    }

    loadPost();
    loadComments();
}

function getDisplayAuthor(post, userIsAdmin) {
    if (post.isAnonymous) {
        return userIsAdmin ? `익명 (${escapeHtml(post.author)})` : "익명";
    }
    return escapeHtml(post.author);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}