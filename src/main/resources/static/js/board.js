/* ==========================================
   UbiCOM 게시판 목록 관리 스크립트
   - 공지사항과 동일한 고정(📌)/삭제 버튼 UI 및 로직 적용
   - 실시간 인덱스 기반 자동 번호 재정렬 및 검색 기능 연동
   - 비밀글 기능 및 익명 실명 노출 권한 반영
   ========================================== */

let allPosts = []; // 전체 게시글 목록 저장용
let searchQuery = ''; // 검색어 저장용
let targetPostIdToDelete = null; // 삭제할 게시글 ID 저장용

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof requireLogin === 'function' && !requireLogin()) return;

    await loadPosts();

    // 모달 및 이벤트 바인딩
    const createPostBtn = document.getElementById("create-post-btn");
    const createModal = document.getElementById("create-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const cancelBtn = document.getElementById("cancel-btn");
    const createForm = document.getElementById("create-post-form");
    const searchInput = document.getElementById("search-input");

    if (createPostBtn) {
        createPostBtn.addEventListener("click", () => {
            resetPostForm();
            if (createModal) {
                createModal.classList.remove("hidden");
                createModal.classList.add("flex");
            }
        });
    }

    if (closeModalBtn) closeModalBtn.addEventListener("click", closePostModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closePostModal);

    if (createModal) {
        createModal.addEventListener("click", (e) => {
            if (e.target === createModal) closePostModal();
        });
    }

    if (createForm) {
        createForm.addEventListener("submit", handleCreatePost);
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            onSearch(e.target.value);
        });
    }

    // 삭제 모달 '삭제하기' 버튼 이벤트 등록
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', executeDeletePost);
    }
});

// 게시글 작성 폼 초기화
function resetPostForm() {
    const titleInput = document.getElementById("post-title");
    const contentInput = document.getElementById("post-content");
    const anonymousCheckbox = document.getElementById("anonymous-checkbox");
    const secretCheckbox = document.getElementById("secret-checkbox");

    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    if (anonymousCheckbox) anonymousCheckbox.checked = false;
    if (secretCheckbox) secretCheckbox.checked = false;

    const errorBox = document.getElementById("modal-error");
    if (errorBox) errorBox.classList.add("hidden");
}

// 모달 닫기
function closePostModal() {
    const modal = document.getElementById("create-modal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
    resetPostForm();
}

// ── 1. 백엔드 DB에서 게시글 목록 가져오기 ───────────────────────────
async function loadPosts() {
    const pcTbody = document.getElementById("posts-list-pc");
    const mobileContainer = document.getElementById("posts-list-mobile");
    if (!pcTbody || !mobileContainer) return;

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error('서버 응답 오류: ' + response.status);
        }

        allPosts = await response.json();

        // 고정글(pinned) 우선 정렬 후 최신순 정렬
        allPosts.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        renderPosts();

    } catch (error) {
        console.error('게시글 목록 불러오기 실패:', error);
        allPosts = [];
        renderPosts();
    }
}

// 검색어 입력 시 호출되는 함수
function onSearch(query) {
    searchQuery = query.toLowerCase().trim();
    renderPosts();
}

// 날짜 포맷팅 함수 (YYYY-MM-DD HH:mm)
function formatPostDate(isoStr) {
    if (!isoStr) return "";
    return new Date(isoStr).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\. /g, '-').replace('.', '');
}

// 권한 확인 헬퍼 함수 (작성자 본인 또는 관리자일 경우 삭제/수정 권한 부여)
function canModifyPost(post) {
    return Boolean(
        post &&
        post.canManage === true
    );
}

// 익명 여부 및 권한에 따른 표시용 작성자명 (목록용)
function getDisplayAuthorForList(post) {
    if (!post) return '익명';

    return escapeHtml(
        post.authorName || '익명'
    );
}

// ── 2. 게시글 고정(핀) 토글 기능 함수 ───────────────
async function togglePinPost(event, postId) {
    if (event) event.stopPropagation();

    if (typeof isAdmin === 'function' && !isAdmin()) {
        alert('관리자 권한이 필요합니다.');
        return;
    }

    const post = allPosts.find(p => String(p.id) === String(postId));
    if (!post) return;

    const newPinnedState = !post.isPinned;

    try {
        const response = await fetch(`/api/posts/${postId}/pin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPinned: newPinnedState })
        });

        if (!response.ok) throw new Error('고정 상태 변경 실패');

        post.isPinned = newPinnedState;

        allPosts.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        renderPosts();
    } catch (error) {
        console.error('고정 처리 오류:', error);
        post.isPinned = newPinnedState;
        allPosts.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        renderPosts();
    }
}

// ── 3. 게시글 목록 테이블 렌더링 ──
function renderPosts() {
    const pcTbody = document.getElementById("posts-list-pc");
    const mobileContainer = document.getElementById("posts-list-mobile");
    if (!pcTbody || !mobileContainer) return;

    // 검색어 필터링
    const filteredPosts = allPosts.filter(post => {
        if (!searchQuery) return true;
        const displayAuthorName =
            post.authorName || '';

        return (
            post.title &&
            post.title.toLowerCase().includes(searchQuery)
        ) || (
            post.content &&
            post.content.toLowerCase().includes(searchQuery)
        ) || (
            displayAuthorName &&
            displayAuthorName.toLowerCase().includes(searchQuery)
        );
    });

    if (filteredPosts.length === 0) {
        pcTbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400 bg-white">검색 결과가 없습니다.</td></tr>`;
        mobileContainer.innerHTML = `<div class="text-center py-12 text-gray-400 text-sm bg-white">검색 결과가 없습니다.</div>`;
        return;
    }

    const totalCount = filteredPosts.length;
    const adminUser = typeof isAdmin === 'function' ? isAdmin() : false;

    // PC 테이블 렌더링
    pcTbody.innerHTML = filteredPosts.map((post, index) => {
        const displayNum = totalCount - index;
        const displayAuthor = getDisplayAuthorForList(post);
        const formattedDate = formatPostDate(post.createdAt);
        const isPinned = post.isPinned === true;
        const hasModifyAuth = canModifyPost(post);
        const secretIcon = post.isSecret ? '<span class="mr-1 text-gray-500" title="비밀글">🔒</span>' : '';
        const commentsCount =
            post.commentsCount ??
            post.commentCount ??
            post.comment_count ??
            (post.comments ? post.comments.length : 0);

        return `
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer ${isPinned ? 'bg-blue-50/40 font-semibold' : ''}" onclick="goToPostDetail('${post.id}')">
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs">
                    ${isPinned ? '<span class="text-blue-600 font-bold">📌</span>' : displayNum}
                </td>
                <td class="py-3.5 px-4 text-gray-900">
                    <div class="flex items-center gap-1.5">
                        ${isPinned ? '<span class="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">고정</span>' : ''}
                        <span class="hover:underline">${secretIcon}${escapeHtml(post.title)}</span>
                    </div>
                </td>
                <td class="py-3.5 px-4 text-right text-gray-600 text-xs whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                        ${hasModifyAuth ? `
                            <div class="flex items-center gap-1 mr-1" onclick="event.stopPropagation();">
                                ${adminUser ? `
                                    <button onclick="togglePinPost(event, '${post.id}')" class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer ${isPinned ? 'text-blue-600 bg-blue-50' : ''}" title="고정">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                                    </button>
                                ` : ''}
                                <button onclick="openDeleteModal(event, '${post.id}')" class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="삭제">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ` : ''}
                        <span>${displayAuthor}</span>
                    </div>
                </td>
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs whitespace-nowrap">${formattedDate}</td>
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs whitespace-nowrap">${post.views || 0}</td>
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs whitespace-nowrap">
                    <span class=" font-medium">${commentsCount}</span>
                </td>
            </tr>
        `;
    }).join('');

    // 모바일 카드 렌더링
    mobileContainer.innerHTML = filteredPosts.map((post, index) => {
        const displayNum = totalCount - index;
        const displayAuthor = getDisplayAuthorForList(post);
        const formattedDate = formatPostDate(post.createdAt);
        const isPinned = post.isPinned === true;
        const hasModifyAuth = canModifyPost(post);
        const secretIcon = post.isSecret ? '<span class="mr-1 text-gray-500" title="비밀글">🔒</span>' : '';
        const commentsCount =
            post.commentsCount ??
            post.commentCount ??
            post.comment_count ??
            (post.comments ? post.comments.length : 0);

        return `
            <div class="p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors" onclick="goToPostDetail('${post.id}')">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        ${isPinned ? '<span class="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">고정</span>' : `<span class="text-xs font-bold text-gray-400">#${displayNum}</span>`}
                        <span class="text-sm font-bold text-gray-900 leading-snug">${secretIcon}${escapeHtml(post.title)}</span>
                    </div>
                    ${hasModifyAuth ? `
                        <div class="flex items-center gap-1 shrink-0" onclick="event.stopPropagation();">
                            ${adminUser ? `
                                <button onclick="togglePinPost(event, '${post.id}')" class="p-1 text-gray-400 hover:text-blue-600 ${isPinned ? 'text-blue-600' : ''}" title="고정">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                                </button>
                            ` : ''}
                            <button onclick="openDeleteModal(event, '${post.id}')" class="p-1 text-gray-400 hover:text-red-600" title="삭제">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span class="font-medium text-gray-700">${displayAuthor}</span>
                    <div class="flex items-center gap-2.5">
                        <span>작성일 ${formattedDate}</span>
                        <span>·</span>
                        <span>조회 ${post.views || 0}</span>
                        <span>·</span>
                        <span>댓글 ${commentsCount}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 상세 페이지 이동 (비밀글 권한 검증 추가)
function goToPostDetail(postId) {
    const post = allPosts.find(p => String(p.id) === String(postId));
    if (post && post.isSecret) {
        if (!canModifyPost(post)) {
            alert("🔒 비밀글은 작성자와 관리자만 볼 수 있습니다.");
            return;
        }
    }
    window.location.href = `/board_detail?id=${postId}`;
}

// ── 4. 커스텀 삭제 모달 제어 ───────
function openDeleteModal(event, postId) {
    if (event) event.stopPropagation();

    targetPostIdToDelete = postId;
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeDeleteModal() {
    targetPostIdToDelete = null;
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('hidden');
}

async function executeDeletePost() {
    if (!targetPostIdToDelete) return;

    try {
        const response = await fetch(`/api/posts/${targetPostIdToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('게시글 삭제 실패');

        closeDeleteModal();
        await loadPosts();
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        alert('삭제 처리 중 오류가 발생했습니다.');
    }
}

// ── 5. 새 게시글 저장 (비밀글 옵션 반영) ───────────────────────────
async function handleCreatePost(event) {
    event.preventDefault();

    const titleInput = document.getElementById("post-title");
    const contentInput = document.getElementById("post-content");
    const anonymousCheckbox = document.getElementById("anonymous-checkbox");
    const secretCheckbox = document.getElementById("secret-checkbox");

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        showModalError("제목과 내용을 모두 입력해 주세요.");
        return;
    }



    const postData = {
        title: title,
        content: content,

        isAnonymous: anonymousCheckbox
            ? anonymousCheckbox.checked
            : false,

        isSecret: secretCheckbox
            ? secretCheckbox.checked
            : false,

        isPinned: false
    };

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "게시글 등록 실패");
        }

        closePostModal();
        await loadPosts();

    } catch (error) {
        console.error('게시글 작성 오류:', error);
        showModalError(error.message || '게시글 등록 중 오류가 발생했습니다.');
    }
}

function showModalError(message) {
    const errorBox = document.getElementById("modal-error");
    if (errorBox) {
        const pTag = errorBox.querySelector("p");
        if (pTag) pTag.textContent = message;
        errorBox.classList.remove("hidden");
    } else {
        alert(message);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}