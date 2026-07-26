"use strict";

let allPosts = [];

document.addEventListener("DOMContentLoaded", () => {
    loadPosts();
    initBoardEvents();
});

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
        renderPosts(allPosts);

    } catch (error) {
        console.error('게시글 목록 불러오기 실패:', error);
        postListContainer.innerHTML = '<p class="text-center text-red-500 py-8">게시글을 불러오는 데 실패했습니다.</p>';
    }
}

// ── 2. 게시글 목록 화면 렌더링 ────────────────────────────────────
function renderPosts(posts) {
    const postListContainer = document.getElementById("posts-list");
    if (!postListContainer) return;

    postListContainer.innerHTML = '';

    if (!posts || posts.length === 0) {
        postListContainer.innerHTML = '<p class="text-center text-gray-500 py-12 bg-white rounded-lg border border-gray-200">등록된 게시글이 없습니다.</p>';
        return;
    }

    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer';

        // ★ 익명글 처리 및 작성자 이름 판단
        let displayAuthor = "익명";
        if (post.isAnonymous) {
            displayAuthor = "익명";
        } else if (post.authorName && post.authorName !== "알 수 없음") {
            displayAuthor = post.authorName;
        } else if (post.author && post.author.name) {
            displayAuthor = post.author.name;
        }

        const formattedDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) : '';

        // ★ 하단 정보 영역에 작성자 이름 추가 (조회수 왼쪽)
        postCard.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">${escapeHtml(post.title)}</h3>
            </div>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">${escapeHtml(post.content)}</p>
            <div class="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-100">
                <div class="flex items-center gap-3">
                    <span class="font-medium text-gray-600">${escapeHtml(displayAuthor)}</span>
                    <span>·</span>
                    <span>조회수 ${post.views || 0}</span>
                </div>
                <span>${formattedDate}</span>
            </div>
        `;

        // 카드 클릭 시 상세 페이지로 이동 (id 전달)
        postCard.onclick = () => {
            window.location.href = `/board_detail?id=${post.id}`;
        };

        postListContainer.appendChild(postCard);
    });
}

// ── 3. 새 게시글 저장 (POST /api/posts) ───────────────────────────
async function handleCreatePost(event) {
    event.preventDefault();

    const titleInput = document.getElementById("post-title");
    const contentInput = document.getElementById("post-content");
    const anonymousCheckbox = document.getElementById("anonymous-checkbox");

    if (!titleInput || !contentInput) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.userId || currentUser.id || currentUser.studentId || 20260001;

    const postData = {
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        userId: parseInt(userId, 10),
        isAnonymous: anonymousCheckbox ? anonymousCheckbox.checked : false
    };

    if (!postData.title || !postData.content) {
        showModalError("제목과 내용을 모두 입력해 주세요.");
        return;
    }

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

        titleInput.value = '';
        contentInput.value = '';
        if (anonymousCheckbox) anonymousCheckbox.checked = false;
        closeModal();

        loadPosts();

    } catch (error) {
        console.error('게시글 작성 오류:', error);
        showModalError(error.message || '게시글 등록 중 오류가 발생했습니다.');
    }
}

// ── 4. 모달 및 검색 이벤트 핸들러 초기화 ─────────────────────────────
function initBoardEvents() {
    const modal = document.getElementById("create-modal");
    const openBtn = document.getElementById("create-post-btn");
    const closeBtn = document.getElementById("close-modal");
    const cancelBtn = document.getElementById("cancel-btn");
    const createForm = document.getElementById("create-post-form");
    const searchInput = document.getElementById("search-input");

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            modal.classList.add("flex");
        });
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    if (createForm) {
        createForm.addEventListener("submit", handleCreatePost);
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            if (!keyword) {
                renderPosts(allPosts);
                return;
            }
            const filtered = allPosts.filter(post =>
                (post.title && post.title.toLowerCase().includes(keyword)) ||
                (post.content && post.content.toLowerCase().includes(keyword)) ||
                (post.authorName && post.authorName.toLowerCase().includes(keyword))
            );
            renderPosts(filtered);
        });
    }
}

function closeModal() {
    const modal = document.getElementById("create-modal");
    const errorBox = document.getElementById("modal-error");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
    if (errorBox) errorBox.classList.add("hidden");
}

function showModalError(message) {
    const errorBox = document.getElementById("modal-error");
    if (errorBox) {
        errorBox.querySelector("p").textContent = message;
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