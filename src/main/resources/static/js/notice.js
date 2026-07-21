// Notice page functionality

let allNotices = []; // 전체 공지사항 목록 저장용
let searchQuery = ''; // 검색어 저장용

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;

    // Show admin controls if user is admin
    if (isAdmin()) {
        const adminControls = document.getElementById('admin-controls');
        if (adminControls) adminControls.classList.remove('hidden');
    }

    loadNotices();

    // Create notice button
    const createNoticeBtn = document.getElementById('create-notice-btn');
    const createModal = document.getElementById('create-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');

    if (createNoticeBtn) {
        createNoticeBtn.addEventListener('click', function() {
            if (!requireAdmin()) return;
            createModal.classList.remove('hidden');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            createModal.classList.add('hidden');
            document.getElementById('create-notice-form').reset();
            hideError('modal-error');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            createModal.classList.add('hidden');
            document.getElementById('create-notice-form').reset();
            hideError('modal-error');
        });
    }

    // Create notice form
    const createNoticeForm = document.getElementById('create-notice-form');
    if (createNoticeForm) {
        createNoticeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateNotice();
        });
    }
});

// 공지사항 불러오기
function loadNotices() {
    allNotices = JSON.parse(localStorage.getItem('notices') || '[]');

    // Sort by date (newest first)
    allNotices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    renderNotices();
}

// 검색어 입력 시 호출되는 함수 (HTML의 onSearch(this.value) 연동)
function onSearch(query) {
    searchQuery = query.toLowerCase().trim();
    renderNotices();
}

// 공지사항 화면 렌더링
function renderNotices() {
    const noticesList = document.getElementById('notices-list');
    if (!noticesList) return;

    // 검색어 필터링 (제목 또는 내용에 포함 시)
    const filteredNotices = allNotices.filter(notice => {
        if (!searchQuery) return true;
        return notice.title.toLowerCase().includes(searchQuery) ||
            notice.content.toLowerCase().includes(searchQuery);
    });

    if (filteredNotices.length === 0) {
        noticesList.innerHTML = `
            <div class="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                ${searchQuery ? '검색 결과가 없습니다.' : '아직 작성된 공지사항이 없습니다.'}
            </div>
        `;
        return;
    }

    // 클릭 시 모달 대신 notice-detail.html 페이지로 이동
    noticesList.innerHTML = filteredNotices.map(notice => `
        <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6" onclick="goToNoticeDetail('${notice.id}')">
            <div class="flex items-start justify-between gap-4 mb-2">
                <h3 class="text-xl font-bold flex-1">${escapeHtml(notice.title)}</h3>
                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex-shrink-0">공지</span>
            </div>
            <p class="text-gray-600 mb-4 line-clamp-2">${escapeHtml(notice.content)}</p>
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>${escapeHtml(notice.author)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>${formatDate ? formatDate(notice.createdAt) : notice.createdAt.split('T')[0]}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span>조회 ${notice.views || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 상세 페이지 이동 함수
function goToNoticeDetail(noticeId) {
    window.location.href = `/notice-detail.html?id=${noticeId}`;
}

function handleCreateNotice() {
    hideError('modal-error');

    const title = document.getElementById('notice-title').value.trim();
    const content = document.getElementById('notice-content').value.trim();

    if (!title || !content) {
        showError('modal-error', '제목과 내용을 모두 입력해주세요.');
        return;
    }

    const user = getCurrentUser();
    if (!user || !user.isAdmin) {
        showError('modal-error', '관리자만 공지사항을 작성할 수 있습니다.');
        return;
    }

    const newNotice = {
        id: Date.now().toString(),
        title: title,
        content: content,
        author: user.username,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        views: 0
    };

    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    notices.push(newNotice);
    localStorage.setItem('notices', JSON.stringify(notices));

    // Close modal and reset form
    document.getElementById('create-modal').classList.add('hidden');
    document.getElementById('create-notice-form').reset();

    // Reload notices
    loadNotices();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}