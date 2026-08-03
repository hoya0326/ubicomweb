/* ==========================================
   UbiCOM 게시판 목록 관리 스크립트
   - 공지사항과 동일한 고정(📌)/삭제 버튼 UI 및 로직 적용
   - 실시간 인덱스 기반 자동 번호 재정렬 및 검색 기능 연동
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

    // 삭제 모달 '삭제하기' 버튼 이벤트 등록 (공지사항과 동일한 방식)
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

    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    if (anonymousCheckbox) anonymousCheckbox.checked = false;

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
    const postListContainer = document.getElementById("posts-list");
    if (!postListContainer) return;

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error('서버 응답 오류: ' + response.status);
        }

        allPosts = await response.json();

        // 고정글(pinned) 우선 정렬 후 최신순 정렬 (공지사항과 동일한 정렬 규칙)
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
    if (typeof isAdmin === 'function' && isAdmin()) return true;

    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) return false;

    const currentUserId = String(user.userId || user.id || '');
    const postUserId = String(post.userId || (post.author ? post.author.id : ''));

    return currentUserId && postUserId && currentUserId === postUserId;
}

// ── 2. 게시글 고정(핀) 토글 기능 함수 (공지사항과 동일) ───────────────
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

        // 정렬 상태 반영 후 재렌더링
        allPosts.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        renderPosts();
    } catch (error) {
        console.error('고정 처리 오류:', error);
        // API 엔드포인트 미구현 시 프론트엔드 임시 처리
        post.isPinned = newPinnedState;
        allPosts.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        renderPosts();
    }
}

// ── 3. 게시글 목록 테이블 렌더링 (작성자명 줄바꿈 방지 적용) ──
function renderPosts() {
    const postListContainer = document.getElementById("posts-list");
    if (!postListContainer) return;

    // 검색어 필터링
    const filteredPosts = allPosts.filter(post => {
        if (!searchQuery) return true;
        const displayAuthor = post.isAnonymous ? "익명" : (post.authorName || (post.author ? post.author.name : ''));
        return (post.title && post.title.toLowerCase().includes(searchQuery)) ||
            (post.content && post.content.toLowerCase().includes(searchQuery)) ||
            (displayAuthor && displayAuthor.toLowerCase().includes(searchQuery));
    });

    if (filteredPosts.length === 0) {
        postListContainer.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-12 text-gray-400 bg-white">
                    ${searchQuery ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.'}
                </td>
            </tr>
        `;
        return;
    }

    const totalCount = filteredPosts.length;
    const adminUser = typeof isAdmin === 'function' ? isAdmin() : false;

    postListContainer.innerHTML = filteredPosts.map((post, index) => {
        const displayNum = totalCount - index;

        // 익명글 처리 및 작성자 이름 판단
        let displayAuthor = "익명";
        if (post.isAnonymous) {
            displayAuthor = "익명";
        } else if (post.authorName && post.authorName !== "알 수 없음") {
            displayAuthor = post.authorName;
        } else if (post.author && post.author.name) {
            displayAuthor = post.author.name;
        }

        const formattedDate = formatPostDate(post.createdAt);
        const isPinned = post.isPinned === true;
        const hasModifyAuth = canModifyPost(post);

        return `
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer ${isPinned ? 'bg-blue-50/40 font-semibold' : ''}">
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs" onclick="goToPostDetail('${post.id}')">
                    ${isPinned ? '<span class="text-blue-600 font-bold">📌</span>' : displayNum}
                </td>
                <td class="py-3.5 px-4 text-gray-900" onclick="goToPostDetail('${post.id}')">
                    <div class="flex items-center gap-1.5">
                        ${isPinned ? '<span class="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">고정</span>' : ''}
                        <span class="hover:underline">${escapeHtml(post.title)}</span>
                    </div>
                </td>
                <td class="py-3.5 px-4 text-right text-gray-600 text-xs whitespace-nowrap" onclick="goToPostDetail('${post.id}')">
                    <div class="flex items-center justify-end gap-1.5">
                        ${hasModifyAuth ? `
                            <div class="flex items-center gap-1 mr-1" onclick="event.stopPropagation();">
                                ${adminUser ? `
                                    <button 
                                        onclick="togglePinPost(event, '${post.id}')" 
                                        class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer ${isPinned ? 'text-blue-600 bg-blue-50' : ''}"
                                        title="${isPinned ? '고정 해제' : '게시물 고정'}"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                                        </svg>
                                    </button>
                                ` : ''}
                                <button 
                                    onclick="openDeleteModal(event, '${post.id}')" 
                                    class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="게시글 삭제"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                        <span>${escapeHtml(displayAuthor)}</span>
                    </div>
                </td>
                <!-- 작성일시 중앙 정렬 적용 (text-center, whitespace-nowrap) -->
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs whitespace-nowrap" onclick="goToPostDetail('${post.id}')">${formattedDate}</td>
                <!-- 조회수 중앙 정렬 적용 (text-center, whitespace-nowrap) -->
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs whitespace-nowrap" onclick="goToPostDetail('${post.id}')">${post.views || 0}</td>
            </tr>
        `;
    }).join('');
}

// 상세 페이지 이동
function goToPostDetail(postId) {
    window.location.href = `/board_detail?id=${postId}`;
}

// ── 4. 커스텀 삭제 모달 제어 (공지사항과 동일한 모달 ID 사용) ───────
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

// ── 5. 새 게시글 저장 (POST /api/posts) ───────────────────────────
async function handleCreatePost(event) {
    event.preventDefault();

    const titleInput = document.getElementById("post-title");
    const contentInput = document.getElementById("post-content");
    const anonymousCheckbox = document.getElementById("anonymous-checkbox");

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        showModalError("제목과 내용을 모두 입력해 주세요.");
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.userId || currentUser.id || currentUser.studentId || 20260001;

    const postData = {
        title: title,
        content: content,
        userId: parseInt(userId, 10),
        isAnonymous: anonymousCheckbox ? anonymousCheckbox.checked : false,
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