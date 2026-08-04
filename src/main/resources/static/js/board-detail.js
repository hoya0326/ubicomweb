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

    const currentUserId = String(user.userId || user.id || user.studentId || user.username || '');

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

// 작성자 이름 추출 헬퍼 함수
function getAuthorName(item) {
    if (!item) return '익명';

    if (item.author && typeof item.author === 'object') {
        const nameCandidate = item.author.name || item.author.nickname || item.author.username;
        if (nameCandidate && nameCandidate !== '기본사용자') {
            return nameCandidate;
        }
    }

    if (typeof item.author === 'string' && item.author.trim() !== '' && item.author !== '기본사용자') {
        return item.author;
    }

    const directName = item.authorName || item.writer || item.nickname || item.userName || item.username;
    if (directName && directName !== '기본사용자') {
        return directName;
    }

    const currentUser = getLoggedInUser();
    if (currentUser) {
        const currentUserId = String(currentUser.userId || currentUser.id || currentUser.studentId || '');
        const itemUserId = String(item.userId || item.authorId || (item.author && item.author.id) || '');

        if (currentUserId && itemUserId && currentUserId === itemUserId) {
            const myName = currentUser.name || currentUser.nickname || currentUser.username;
            if (myName) return myName;
        }
    }

    return item.authorName || item.author || '익명';
}

// 익명 여부에 따른 표시용 작성자명 (본인 또는 관리자에게만 실명 노출)
function getDisplayAuthor(item, userIsAdmin) {
    if (!item) return "익명";

    const realAuthor = item.realAuthorName || getAuthorName(item);
    const isAnon = item.isAnonymous || item.anonymous;

    if (isAnon) {
        const isOwner = isAuthorOrAdmin(item);
        if (userIsAdmin || isOwner) {
            return `익명 <span class="text-xs text-blue-600 font-normal ms-1">(${escapeHtml(realAuthor)})</span>`;
        }
        return "익명";
    }

    return escapeHtml(realAuthor);
}

// 게시글 상세 조회 (비밀글 권한 체크 파라미터 보완)
async function loadPost() {
    const user = getLoggedInUser();
    const userId = user.userId || user.id || user.studentId || '';

    const userIsAdmin = (typeof isAdmin === 'function' && isAdmin()) ||
        user.role === 'ADMIN' ||
        user.role === 'admin' ||
        user.username === 'admin' ||
        String(user.userId) === 'admin';

    const role = userIsAdmin ? 'ADMIN' : (user.role || '');

    try {
        const response = await fetch(`/api/posts/${currentPostId}?userId=${userId}&role=${role}`);

        if (response.status === 403) {
            alert("🔒 비밀글은 작성자와 관리자만 볼 수 있습니다.");
            window.location.href = '/board';
            return;
        }

        if (!response.ok) {
            throw new Error('게시글을 불러올 수 없습니다.');
        }

        const post = await response.json();
        currentPost = post;

        const userIsAdminFlag = typeof isAdmin === 'function' ? isAdmin() : userIsAdmin;
        const canManage = isAuthorOrAdmin(post);
        const displayAuthor = getDisplayAuthor(post, userIsAdminFlag);

        const createdTime = new Date(post.createdAt).getTime();
        const updatedTime = post.updatedAt ? new Date(post.updatedAt).getTime() : createdTime;
        const isEdited = post.updatedAt && (updatedTime - createdTime > 1000);

        let timeStr = formatDate(post.createdAt);
        if (isEdited) {
            timeStr += ` <span class="text-gray-400 text-[11px]">(수정됨: ${formatDate(post.updatedAt)})</span>`;
        }

        const commentsCount = post.commentsCount !== undefined ? post.commentsCount : (post.comments ? post.comments.length : 0);
        const secretBadge = post.isSecret ? '<span class="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded mr-2">🔒 비밀글</span>' : '';

        document.getElementById('post-content').innerHTML = `
            <div class="p-6 md:p-8">
                <div class="border-b border-gray-100 pb-4 mb-6">
                    <div class="flex justify-between items-start gap-3 mb-3">
                        <h1 class="text-xl md:text-3xl font-bold text-gray-900 break-words leading-snug flex-1 flex items-center flex-wrap">${secretBadge}${escapeHtml(post.title)}</h1>
                        ${canManage ? `
                            <div class="flex items-center gap-1.5 shrink-0">
                                <button onclick="renderEditForm()" class="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer">수정</button>
                                <button onclick="deletePost()" class="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer">삭제</button>
                            </div>
                        ` : ''}
                    </div>

                    <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500">
                        <span class="font-semibold text-gray-800">${displayAuthor}</span>
                        <span class="text-gray-300">·</span>
                        <span>${timeStr}</span>
                        <span class="text-gray-300">·</span>
                        <span>조회 ${post.views || 0}</span>
                        <span class="text-gray-300">·</span>
                        <span>댓글 ${commentsCount}</span>
                    </div>
                </div>
                
                <div class="text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[120px] text-base">${escapeHtml(post.content)}</div>
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

// 게시글 수정 폼 렌더링
function renderEditForm() {
    if (!currentPost) return;

    document.getElementById('post-content').innerHTML = `
        <div class="p-6 md:p-8">
            <form id="edit-post-form" onsubmit="handleUpdatePost(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input type="text" id="edit-title" value="${escapeHtml(currentPost.title)}" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <textarea id="edit-content" rows="8" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>${escapeHtml(currentPost.content)}</textarea>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="button" onclick="loadPost()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm cursor-pointer">취소</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm cursor-pointer">수정 완료</button>
                </div>
            </form>
        </div>
    `;
}

// 게시글 수정 처리
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

// 댓글 목록 조회 및 렌더링
async function loadComments() {
    const commentsSection = document.getElementById('comments-section');
    if (!commentsSection) return;

    try {
        let response = await fetch(`/api/posts/${currentPostId}/comments`);
        if (response.status === 404) {
            response = await fetch(`/api/comments?postId=${currentPostId}`);
        }

        if (!response.ok) throw new Error('댓글 목록을 불러오지 못했습니다.');

        const comments = await response.json();
        const userIsAdmin = typeof isAdmin === 'function' ? isAdmin() : false;

        commentsSection.innerHTML = `
            <div class="px-2 py-4 md:px-6 md:py-6">
                <h2 class="text-base font-bold text-gray-900 mb-3 px-1">
                    댓글 <span class="text-blue-600">${comments.length}</span>개
                </h2>
                
                <form id="comment-form" class="mb-5 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <textarea 
                        id="comment-content"
                        rows="4"
                        placeholder="댓글을 남겨주세요..."
                        class="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none mb-2.5"
                        required
                    ></textarea>
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                            <input type="checkbox" id="comment-anonymous-checkbox" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
                            익명으로 작성
                        </label>
                        <button type="submit" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                            댓글 등록
                        </button>
                    </div>
                </form>
                
                ${comments.length > 0 ? `
                    <div class="divide-y divide-gray-100 px-1">
                        ${comments.map(comment => {
            const canDeleteComment = isAuthorOrAdmin(comment);
            const authorDisplay = getDisplayAuthor(comment, userIsAdmin);
            return `
                                <div class="py-3.5 first:pt-0 last:pb-0">
                                    <div class="flex items-center justify-between gap-2 mb-1">
                                        <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                                            <span class="font-bold text-gray-800 text-sm">${authorDisplay}</span>
                                            <span class="text-gray-300">·</span>
                                            <span>${formatDate(comment.createdAt)}</span>
                                        </div>
                                        ${canDeleteComment ? `
                                            <button onclick="deleteComment('${comment.id}')" class="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer shrink-0">
                                                삭제
                                            </button>
                                        ` : ''}
                                    </div>
                                    <p class="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">${escapeHtml(comment.content)}</p>
                                </div>
                            `;
        }).join('')}
                    </div>
                ` : `
                    <p class="text-center text-gray-400 py-6 text-xs">등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
                `}
            </div>
        `;

        document.getElementById('comment-form').addEventListener('submit', handleAddComment);
    } catch (error) {
        console.error('댓글 작성/로딩 오류:', error);
    }
}

// 댓글 등록
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
                userId: userId,
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

// 게시글 삭제
async function deletePost() {
    if (!isAuthorOrAdmin(currentPost)) {
        alert('삭제 권한이 없습니다.');
        return;
    }

    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
        const response = await fetch(`/api/posts/${currentPostId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 405) {
                throw new Error('서버에서 DELETE 요청을 허용하지 않습니다.');
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

// 댓글 삭제
async function deleteComment(commentId) {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    try {
        let response = await fetch(`/api/posts/${currentPostId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

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