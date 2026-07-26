// Board detail page functionality

let currentPost = null;
let currentPostId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof requireLogin === 'function' && !requireLogin()) return;

    // URL에서 게시글 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get('id');

    if (!currentPostId) {
        window.location.href = '/board';
        return;
    }

    loadPost();
    loadComments();
});

// 현재 로그인 유저 정보 가져오기 (공통 헬퍼)
function getLoggedInUser() {
    if (typeof getCurrentUser === 'function') {
        const u = getCurrentUser();
        if (u) return u;
    }
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
}

// 작성자 본인 또는 관리자 권한 확인
function isAuthorOrAdmin(item) {
    if (!item) return false;

    const userIsAdmin = typeof isAdmin === 'function' ? isAdmin() : false;
    if (userIsAdmin) return true;

    const user = getLoggedInUser();
    if (!user) return false;

    // user 객체의 식별자 (userId, id, studentId, username 등)
    const currentUserId = String(user.userId || user.id || user.studentId || user.username || '');

    // author가 객체 형태일 경우와 일반 값 형태 모두 대응
    let itemAuthorId = '';
    if (item.author && typeof item.author === 'object') {
        itemAuthorId = String(item.author.userId || item.author.id || item.author.studentId || item.author.username || '');
    } else {
        itemAuthorId = String(item.userId || item.authorId || item.studentId || item.author || '');
    }

    if (currentUserId && itemAuthorId && currentUserId === itemAuthorId) {
        return true;
    }

    if (user.username) {
        const authorName = typeof item.author === 'object' ? item.author.username : item.author;
        if (user.username === authorName) return true;
    }

    return false;
}

// 날짜 포맷 함수 (YYYY. MM. DD. HH:mm)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// 작성자 이름 추출 헬퍼 함수 (우선순위 강화)
function getAuthorName(item) {
    if (!item) return '익명';

    // 1. author가 객체 형태인 경우 (author.name, author.nickname, author.username 순서로 탐색)
    if (item.author && typeof item.author === 'object') {
        const nameCandidate = item.author.name || item.author.nickname || item.author.username;
        if (nameCandidate && nameCandidate !== '기본사용자') {
            return nameCandidate;
        }
    }

    // 2. author가 문자열인 경우 (단, '기본사용자'가 아니어야 함)
    if (typeof item.author === 'string' && item.author.trim() !== '' && item.author !== '기본사용자') {
        return item.author;
    }

    // 3. authorName / writer / nickname / userName 직속 필드 확인
    const directName = item.authorName || item.writer || item.nickname || item.userName || item.username;
    if (directName && directName !== '기본사용자') {
        return directName;
    }

    // 4. 본인이 작성한 글/댓글인데 백엔드에서 기본사용자로 올 경우 LocalStorage 유저 정보로 보완
    const currentUser = getLoggedInUser();
    if (currentUser) {
        const currentUserId = String(currentUser.userId || currentUser.id || currentUser.studentId || '');
        const itemUserId = String(item.userId || item.authorId || (item.author && item.author.id) || '');

        if (currentUserId && itemUserId && currentUserId === itemUserId) {
            const myName = currentUser.name || currentUser.nickname || currentUser.username;
            if (myName) return myName;
        }
    }

    // 5. 위 조건으로도 이름을 찾지 못한 경우 (최종 기본값)
    return item.authorName || item.author || '익명';
}

// 익명 여부에 따른 표시용 작성자명 (게시물 & 댓글 공통)
function getDisplayAuthor(item, userIsAdmin) {
    if (!item) return "익명";

    // 1. 관리자용 실제 작성자 이름 추출 (DTO의 realAuthorName 우선)
    const realAuthor = item.realAuthorName || getAuthorName(item);

    // 2. 익명 처리 체크 (isAnonymous 또는 anonymous 속성 확인)
    const isAnon = item.isAnonymous || item.anonymous;

    if (isAnon) {
        // 익명글/댓글인데 관리자인 경우 -> '익명 (작성자: 홍길동)' 표시
        if (userIsAdmin) {
            return `익명 <span class="text-xs text-blue-600 font-normal ms-1">(${escapeHtml(realAuthor)})</span>`;
        }
        // 일반 사용자일 경우 -> 단순히 '익명' 표기
        return "익명";
    }

    // 일반 공개글일 경우 실제 작성자 이름 표기
    return escapeHtml(realAuthor);
}

// 게시글 상세 조회 (REST API 연동)
async function loadPost() {
    try {
        const response = await fetch(`/api/posts/${currentPostId}`);
        if (!response.ok) {
            throw new Error('게시글을 불러올 수 없습니다.');
        }

        const post = await response.json();
        currentPost = post;

        const userIsAdmin = typeof isAdmin === 'function' ? isAdmin() : false;
        const canManage = isAuthorOrAdmin(post);
        const displayAuthor = getDisplayAuthor(post, userIsAdmin);

        // 수정 여부 확인 (createdAt과 updatedAt 비교)
        const createdTime = new Date(post.createdAt).getTime();
        const updatedTime = post.updatedAt ? new Date(post.updatedAt).getTime() : createdTime;
        const isEdited = post.updatedAt && (updatedTime - createdTime > 1000);

        let timeHtml = `<span>${formatDate(post.createdAt)}</span>`;
        if (isEdited) {
            timeHtml += `<span class="text-xs text-gray-400 ml-1">(수정됨: ${formatDate(post.updatedAt)})</span>`;
        }

        const commentsCount = post.commentsCount !== undefined ? post.commentsCount : (post.comments ? post.comments.length : 0);

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
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"></path>
                        </svg>
                        ${timeHtml}
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
                        <span>댓글 ${commentsCount}</span>
                    </div>
                </div>
                
                <div class="prose max-w-none whitespace-pre-wrap">${escapeHtml(post.content)}</div>
            </div>
        `;
    } catch (error) {
        console.error('게시글 로딩 실패:', error);
        document.getElementById('post-content').innerHTML = `
            <div class="p-12 text-center">
                <p class="text-gray-500 mb-4">게시글을 찾을 수 없거나 불러오는데 실패했습니다.</p>
                <button onclick="window.location.href='/board'" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                    게시판으로 돌아가기
                </button>
            </div>
        `;
    }
}

// 댓글 화면 렌더링 함수 예시
function renderComments(comments) {
    const commentsListContainer = document.getElementById("comments-list");
    if (!commentsListContainer) return;

    commentsListContainer.innerHTML = '';

    // 현재 로그인된 유저 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    // 어드민 여부 확인 (role이 ADMIN이거나 userId / username / role 기준)
    const isAdmin = currentUser.role === "ADMIN" ||
        currentUser.userId === "admin" ||
        currentUser.username === "admin";

    if (!comments || comments.length === 0) {
        commentsListContainer.innerHTML = '<p class="text-center text-gray-400 py-6">등록된 댓글이 없습니다.</p>';
        return;
    }

    comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = 'p-4 border-b border-gray-100 last:border-b-0';

        // ★ 작성자 이름 표시 로직
        let displayName = comment.authorName || "익명";

        // 익명 댓글이지만 어드민일 경우 실제 작성자 이름을 괄호로 표시
        if (comment.isAnonymous && isAdmin) {
            displayName = `익명 <span class="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-normal ms-1">(작성자: ${escapeHtml(comment.realAuthorName || '알 수 없음')})</span>`;
        } else {
            displayName = escapeHtml(displayName);
        }

        const formattedDate = comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        }) : '';

        commentEl.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-sm text-gray-800">${displayName}</span>
                <span class="text-xs text-gray-400">${formattedDate}</span>
            </div>
            <p class="text-gray-700 text-sm whitespace-pre-wrap">${escapeHtml(comment.content)}</p>
        `;

        commentsListContainer.appendChild(commentEl);
    });
}

// 게시글 수정 처리 (REST API 연동)
async function handleUpdatePost(e) {
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

    try {
        const response = await fetch(`/api/posts/${currentPostId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: updatedTitle,
                content: updatedContent
            })
        });

        if (!response.ok) throw new Error('수정에 실패했습니다.');

        await loadPost();
    } catch (error) {
        console.error('게시글 수정 오류:', error);
        alert('게시글 수정 중 오류가 발생했습니다.');
    }
}

// 1. 댓글 목록 조회 (REST API 연동)
async function loadComments() {
    const commentsSection = document.getElementById('comments-section');
    if (!commentsSection) return;

    try {
        // 백엔드 API 설계에 따라 두 방식 중 하나일 가능성이 높습니다.
        // 표준 RESTful: `/api/posts/${currentPostId}/comments`
        // 쿼리파라미터 방식: `/api/comments?postId=${currentPostId}`
        let response = await fetch(`/api/posts/${currentPostId}/comments`);

        // 404가 날 경우 쿼리 파라미터 방식으로 자동 2차 시도 (Fallback)
        if (response.status === 404) {
            response = await fetch(`/api/comments?postId=${currentPostId}`);
        }

        if (!response.ok) throw new Error('댓글 목록을 불러오지 못했습니다.');

        const comments = await response.json();
        const userIsAdmin = typeof isAdmin === 'function' ? isAdmin() : false;

        commentsSection.innerHTML = `
            <div class="p-6">
                <h2 class="text-xl font-bold mb-6">댓글 ${comments.length}개</h2>
                
                <form id="comment-form" class="mb-6 space-y-4">
                    <textarea 
                        id="comment-content"
                        rows="3"
                        placeholder="댓글을 입력하세요..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    ></textarea>
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" id="comment-anonymous-checkbox" class="rounded text-blue-600 focus:ring-blue-500">
                            익명으로 작성
                        </label>
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors">
                            댓글 작성
                        </button>
                    </div>
                </form>
                
                ${comments.length > 0 ? `
                    <div class="border-t pt-6 space-y-4">
                        ${comments.map(comment => {
            const canDeleteComment = isAuthorOrAdmin(comment);
            const authorDisplay = getDisplayAuthor(comment, userIsAdmin);
            return `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <div class="flex items-start justify-between gap-4 mb-2">
                                        <div class="flex items-center gap-2 text-sm">
                                            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            <span class="font-medium">${authorDisplay}</span>
                                            <span class="text-gray-500">·</span>
                                            <span class="text-gray-500">${formatDate(comment.createdAt)}</span>
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
    } catch (error) {
        console.error('댓글 작성/로딩 오류:', error);
    }
}

// 댓글 등록 (REST API 연동)
async function handleAddComment(e) {
    e.preventDefault();

    const contentInput = document.getElementById('comment-content');
    const content = contentInput.value.trim();
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    const user = getLoggedInUser();
    const userId = user.userId || user.id || user.studentId;

    if (!user || !userId) {
        alert('로그인이 필요합니다.');
        return;
    }

    const anonymousCheckbox = document.getElementById('comment-anonymous-checkbox');

    try {
        const response = await fetch(`/api/posts/${currentPostId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                userId: userId, // 게시글 등록과 동일하게 userId 키 이름 통일
                isAnonymous: anonymousCheckbox ? anonymousCheckbox.checked : false
            })
        });

        if (!response.ok) throw new Error('댓글 등록 실패');

        contentInput.value = '';
        if (anonymousCheckbox) anonymousCheckbox.checked = false;

        await loadPost();
        await loadComments();
    } catch (error) {
        console.error('댓글 등록 오류:', error);
        alert('댓글 작성 중 오류가 발생했습니다.');
    }
}

// 2. 게시글 삭제 (REST API 연동 - Headers 및 METHOD 명시 강화)
async function deletePost() {
    if (!isAuthorOrAdmin(currentPost)) {
        alert('삭제 권한이 없습니다.');
        return;
    }

    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
        // REST API 호출 시 Content-Type 및 DELETE 요청 명시
        const response = await fetch(`/api/posts/${currentPostId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 405) {
                throw new Error('서버에서 DELETE 요청을 허용하지 않습니다. (Controller 매핑 확인 필요)');
            }
            throw new Error('삭제에 실패했습니다.');
        }

        alert('게시글이 삭제되었습니다.');
        window.location.href = '/board';
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        alert(`게시글 삭제 중 오류가 발생했습니다. (${error.message})`);
    }
}

// 3. 댓글 삭제 (REST API 연동 - Fallback 처리 추가)
async function deleteComment(commentId) {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    try {
        let response = await fetch(`/api/posts/${currentPostId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 엔드포인트 경로가 /api/comments/{commentId} 일 경우 대비 Fallback
        if (response.status === 404 || response.status === 405) {
            response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        if (!response.ok) throw new Error('댓글 삭제에 실패했습니다.');

        await loadPost();
        await loadComments();
    } catch (error) {
        console.error('댓글 삭제 오류:', error);
        alert('댓글 삭제 중 오류가 발생했습니다.');
    }
}

// XSS 방지용 HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}