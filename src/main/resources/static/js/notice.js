// Notice page functionality
// notice.js
let allNotices = []; // 전체 공지사항 목록 저장용
let searchQuery = ''; // 검색어 저장용
let noticePollOptions = ['', '']; // 투표 동적 선택지 상태 관리
let targetNoticeIdToDelete = null; // 삭제할 공지 ID 저장용

document.addEventListener('DOMContentLoaded', function() {
    if (typeof requireLogin === 'function' && !requireLogin()) return;

    // Show admin controls if user is admin
    if (typeof isAdmin === 'function' && isAdmin()) {
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
            if (typeof requireAdmin === 'function' && !requireAdmin()) return;
            resetNoticeForm();
            createModal.classList.remove('hidden');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', function () {
            createModal.classList.add('hidden');
            resetNoticeForm();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            createModal.classList.add('hidden');
            resetNoticeForm();
        });
    }

    // Create notice form
    const createNoticeForm = document.getElementById('create-notice-form');
    if (createNoticeForm) {
        createNoticeForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleCreateNotice();
        });
    }

    // 삭제 모달 '삭제하기' 버튼 이벤트 등록
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', executeDeleteNotice);
    }
});

// 공지사항 폼 및 투표 입력 초기화
function resetNoticeForm() {
    const form = document.getElementById('create-notice-form');
    if (form) form.reset();

    if (typeof hideError === 'function') hideError('modal-error');

    // 투표 영역 초기화
    const attachCheck = document.getElementById('attach-poll-check');
    if (attachCheck) attachCheck.checked = false;

    const expiresInput = document.getElementById('poll-expires-at');
    if (expiresInput) expiresInput.value = '';

    togglePollForm(false);
    noticePollOptions = ['', ''];
    renderPollOptionInputs();
}

// 투표 설정 영역 토글
function togglePollForm(show) {
    const area = document.getElementById('poll-form-area');
    if (area) {
        area.classList.toggle('hidden', !show);
    }
}

// 동적 투표 선택지 Input 렌더링
function renderPollOptionInputs() {
    const container = document.getElementById('poll-options-container');
    if (!container) return;

    container.innerHTML = noticePollOptions.map((val, idx) => `
        <div class="flex items-center gap-2">
            <input
                type="text"
                class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="선택지 ${idx + 1}"
                value="${escapeHtml(val)}"
                oninput="noticePollOptions[${idx}] = this.value"
            >
            ${noticePollOptions.length > 2 ? `
                <button type="button" onclick="removePollOptionInput(${idx})" class="text-red-500 hover:text-red-700 px-2 text-sm font-bold">✕</button>
            ` : ''}
        </div>
    `).join('');
}

// 선택지 추가
function addPollOptionField() {
    noticePollOptions.push('');
    renderPollOptionInputs();
}

// 선택지 삭제
function removePollOptionInput(idx) {
    noticePollOptions = noticePollOptions.filter((_, i) => i !== idx);
    renderPollOptionInputs();
}

// 공지사항 불러오기 (REST API 연동)
async function loadNotices() {
    try {
        const response = await fetch('/api/notices');
        if (!response.ok) throw new Error('공지사항 목록 조회 실패');

        allNotices = await response.json();

        // 최신순 정렬
        allNotices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        renderNotices();
    } catch (error) {
        console.error('공지사항 조회 오류:', error);
        allNotices = [];
        renderNotices();
    }
}

// 검색어 입력 시 호출되는 함수
function onSearch(query) {
    searchQuery = query.toLowerCase().trim();
    renderNotices();
}

// 공지사항 화면 렌더링
function renderNotices() {
    const noticesList = document.getElementById('notices-list');
    if (!noticesList) return;

    // 검색어 필터링
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

    const adminUser = typeof isAdmin === 'function' ? isAdmin() : false;

    noticesList.innerHTML = filteredNotices.map(notice => {
        // 작성자 정보 파싱 (백엔드 객체 대응)
        const authorName = notice.author ? (notice.author.name || notice.author.username || '관리자') : (notice.authorName || '관리자');

        return `
        <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 relative group">
            <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex items-center gap-2 flex-1 cursor-pointer" onclick="goToNoticeDetail('${notice.id}')">
                    <h3 class="text-xl font-bold hover:text-blue-600 transition-colors">${escapeHtml(notice.title)}</h3>
                    ${notice.hasPoll ? `<span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">📊 투표첨부</span>` : ''}
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">공지</span>
                    ${adminUser ? `
                        <button 
                            onclick="openDeleteModal(event, '${notice.id}')" 
                            class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="공지 삭제"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            <p class="text-gray-600 mb-4 line-clamp-2 cursor-pointer" onclick="goToNoticeDetail('${notice.id}')">${escapeHtml(notice.content)}</p>
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 cursor-pointer" onclick="goToNoticeDetail('${notice.id}')">
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>${escapeHtml(authorName)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>${typeof formatDate === 'function' ? formatDate(notice.createdAt) : (notice.createdAt ? notice.createdAt.split('T')[0] : '')}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// 커스텀 삭제 모달 열기
function openDeleteModal(event, noticeId) {
    if (event) event.stopPropagation();

    if (typeof isAdmin === 'function' && !isAdmin()) {
        alert('관리자 권한이 필요합니다.');
        return;
    }

    targetNoticeIdToDelete = noticeId;
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('hidden');
}

// 커스텀 삭제 모달 닫기
function closeDeleteModal() {
    targetNoticeIdToDelete = null;
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('hidden');
}

// 공지사항 삭제 최종 실행 (REST API 연동)
async function executeDeleteNotice() {
    if (!targetNoticeIdToDelete) return;

    try {
        const response = await fetch(`/api/notices/${targetNoticeIdToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('공지사항 삭제 실패');

        closeDeleteModal();
        loadNotices();
    } catch (error) {
        console.error('공지 삭제 오류:', error);
        alert('삭제 처리 중 오류가 발생했습니다.');
    }
}

// 상세 페이지 이동 함수
function goToNoticeDetail(noticeId) {
    window.location.href = `/notice_detail?id=${noticeId}`;
}

// 공지사항 생성 처리 (REST API 연동)
async function handleCreateNotice() {
    if (typeof hideError === 'function') hideError('modal-error');

    const title = document.getElementById('notice-title').value.trim();
    const content = document.getElementById('notice-content').value.trim();

    if (!title || !content) {
        if (typeof showError === 'function') showError('modal-error', '제목과 내용을 모두 입력해주세요.');
        return;
    }

    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        if (typeof showError === 'function') showError('modal-error', '로그인이 필요합니다.');
        return;
    }

    const authorName = user.name || user.username || user.id || '관리자';

    // 기본 페이로드 구성
    const postPayload = {
        title: title,
        content: content,
        author: authorName,
        hasPoll: false
    };

    // 💡 투표 첨부 체크박스가 켜져 있는 경우 투표 데이터 수집
    const attachPollCheck = document.getElementById('attach-poll-check');
    if (attachPollCheck && attachPollCheck.checked) {
        const questionInput = document.getElementById('poll-question').value.trim();
        const question = questionInput !== '' ? questionInput : title;

        // 유효한 선택지 필터링 (빈 값 제외)
        const validOptions = noticePollOptions
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

        if (validOptions.length < 2) {
            if (typeof showError === 'function') showError('modal-error', '투표 선택지는 최소 2개 이상 입력해야 합니다.');
            return;
        }

        // 마감 시간 처리
        let endsAt = null;
        const deadlineToggle = document.getElementById('fDeadlineToggle');
        if (deadlineToggle && deadlineToggle.checked) {
            const fDate = document.getElementById('fDate').value;
            const fTime = document.getElementById('fTime').value || '23:59';
            if (fDate) {
                endsAt = `${fDate}T${fTime}:00`;
            }
        }

        const isAnonymous = document.getElementById('poll-anonymous').checked;
        const allowMultiple = document.getElementById('poll-multiple').checked;

        postPayload.hasPoll = true;
        postPayload.poll = {
            title: title,
            question: question,
            isAnonymous: isAnonymous,
            allowMultiple: allowMultiple,
            endsAt: endsAt,
            options: validOptions.map(text => ({ text: text }))
        };
    }

    try {
        const response = await fetch('/api/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
        });

        if (!response.ok) throw new Error('공지사항 등록 실패');

        // 모달 닫기 및 초기화
        const createModal = document.getElementById('create-modal');
        if (createModal) createModal.classList.add('hidden');
        resetNoticeForm();

        // 목록 다시 불러오기
        loadNotices();
    } catch (error) {
        console.error('공지 작성 오류:', error);
        if (typeof showError === 'function') showError('modal-error', '작성 중 오류가 발생했습니다.');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}