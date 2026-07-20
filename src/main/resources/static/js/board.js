// Board page functionality

let searchQuery = '';

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;
    
    loadPosts();
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value.toLowerCase();
        loadPosts();
    });
    
    // Create post button
    const createPostBtn = document.getElementById('create-post-btn');
    const createModal = document.getElementById('create-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    
    createPostBtn.addEventListener('click', function() {
        createModal.classList.remove('hidden');
    });
    
    closeModal.addEventListener('click', function() {
        createModal.classList.add('hidden');
        document.getElementById('create-post-form').reset();
        hideError('modal-error');
    });
    
    cancelBtn.addEventListener('click', function() {
        createModal.classList.add('hidden');
        document.getElementById('create-post-form').reset();
        hideError('modal-error');
    });
    
    // Create post form
    const createPostForm = document.getElementById('create-post-form');
    createPostForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCreatePost();
    });
});

function loadPosts() {
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const user = getCurrentUser();
    const userIsAdmin = isAdmin();
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Filter by search query
    const filteredPosts = posts.filter(post => {
        const searchText = searchQuery.toLowerCase();
        return post.title.toLowerCase().includes(searchText) ||
               post.content.toLowerCase().includes(searchText) ||
               post.author.toLowerCase().includes(searchText);
    });
    
    const postsList = document.getElementById('posts-list');
    
    if (filteredPosts.length === 0) {
        postsList.innerHTML = `
            <div class="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                ${searchQuery ? '검색 결과가 없습니다.' : '아직 작성된 게시글이 없습니다.'}
            </div>
        `;
        return;
    }
    
    postsList.innerHTML = filteredPosts.map(post => {
        const displayAuthor = getDisplayAuthor(post, userIsAdmin);
        
        return `
            <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6" onclick="viewPost('${post.id}')">
                <div class="flex items-start justify-between gap-4 mb-4">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-xl font-bold mb-2 truncate">${escapeHtml(post.title)}</h3>
                        <p class="text-gray-600 line-clamp-2">${escapeHtml(post.content)}</p>
                    </div>
                    ${post.views > 10 ? '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex-shrink-0">인기</span>' : ''}
                </div>
                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                        <span>${formatDate(post.createdAt)}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>${post.views || 0}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span>${post.comments || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

function handleCreatePost() {
    hideError('modal-error');
    
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const isAnonymous = document.getElementById('anonymous-checkbox').checked;
    
    if (!title || !content) {
        showError('modal-error', '제목과 내용을 모두 입력해주세요.');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showError('modal-error', '로그인이 필요합니다.');
        return;
    }
    
    const newPost = {
        id: Date.now().toString(),
        title: title,
        content: content,
        author: user.username,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        views: 0,
        comments: 0,
        isAnonymous: isAnonymous
    };
    
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    posts.push(newPost);
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // Close modal and reset form
    document.getElementById('create-modal').classList.add('hidden');
    document.getElementById('create-post-form').reset();
    
    // Reload posts
    loadPosts();
}

function viewPost(postId) {
    // Increment view count
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        posts[postIndex].views = (posts[postIndex].views || 0) + 1;
        localStorage.setItem('posts', JSON.stringify(posts));
    }
    
    window.location.href = `/board_detail?id=${postId}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
