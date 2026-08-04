/* ==========================================
   UbiCOM 공지사항 목록 관리 스크립트
   - 실시간 인덱스 기반 자동 번호 재정렬 (최신순 역순 번호 매기기: 1번 삭제 시 2번이 1번으로 당겨짐)
   - 첨부파일 및 투표 첨부 아이콘 표시
   - 작성자, 작성일시, 조회수 연동 및 검색 기능
   - 서버 DB 기반 읽음 상태(N 마크) 기기 간 동기화 연동
   notice.js
   ========================================== */

let allNotices = []; // 전체 공지사항 목록 저장용
let searchQuery = ''; // 검색어 저장용
let noticePollOptions = ['', '']; // 투표 동적 선택지 상태 관리
let targetNoticeIdToDelete = null; // 삭제할 공지 ID 저장용
let readNoticeIdsSet = new Set(); // 서버에서 조회한 읽은 공지 ID 집합

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof requireLogin === 'function' && !requireLogin()) return;

    // 관리자 권한인 경우 새 공지 작성 버튼 노출
    if (typeof isAdmin === 'function' && isAdmin()) {
        const adminControls = document.getElementById('admin-controls');
        if (adminControls) adminControls.classList.remove('hidden');
    }

    await loadNotices();

    // 모달 이벤트 바인딩
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

    // 공지 작성 폼 제출
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

    const attachCheck = document.getElementById('attach-poll-check');
    if (attachCheck) attachCheck.checked = false;

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
                <button type="button" onclick="removePollOptionInput(${idx})" class="text-red-500 hover:text-red-700 px-2 text-sm font-bold cursor-pointer">✕</button>
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

// 공지사항 불러오기 (REST API 및 서버 읽음 상태 연동)
async function loadNotices() {
    try {
        const response = await fetch('/api/notices');
        if (!response.ok) throw new Error('공지사항 목록 조회 실패');

        allNotices = await response.json();

        // 서버 DB 기반 읽은 공지사항 목록 조회 (기기 간 동기화)
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const myId = user ? (user.id || user.username || user.userId || '') : '';

        if (myId) {
            try {
                const readRes = await fetch(`/api/notices/reads?userId=${encodeURIComponent(myId)}`);
                if (readRes.ok) {
                    const readIds = await readRes.json();
                    readNoticeIdsSet = new Set(readIds.map(id => String(id)));
                }
            } catch (e) {
                console.error('읽은 공지사항 목록 조회 오류:', e);
            }
        }

        // 고정글(pinned) 우선 정렬 후 최신순 정렬
        allNotices.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

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

// 날짜 포맷팅 함수 (YYYY.MM.DD)
function formatDate(isoStr) {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
}

// 서버 DB 읽음 상태 세트를 기반으로 아직 읽지 않은 글인지 확인 (N 마크 표시용)
function isNewPost(notice) {
    if (!notice || !notice.id) return false;
    return !readNoticeIdsSet.has(String(notice.id));
}

// 게시물 고정(핀) 토글 기능 함수
async function togglePinNotice(event, noticeId) {
    if (event) event.stopPropagation();

    if (typeof isAdmin === 'function' && !isAdmin()) {
        alert('관리자 권한이 필요합니다.');
        return;
    }

    const notice = allNotices.find(n => String(n.id) === String(noticeId));
    if (!notice) return;

    const newPinnedState = !notice.isPinned;

    try {
        const response = await fetch(`/api/notices/${noticeId}/pin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPinned: newPinnedState })
        });

        if (!response.ok) throw new Error('고정 상태 변경 실패');

        notice.isPinned = newPinnedState;

        // 정렬 상태 반영 후 재렌더링
        allNotices.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        renderNotices();
    } catch (error) {
        console.error('고정 처리 오류:', error);
        notice.isPinned = newPinnedState;
        renderNotices();
    }
}

// 공지사항 테이블 렌더링
function renderNotices() {
    const tbody = document.getElementById('notice-list-tbody');
    if (!tbody) return;

    // 검색어 필터링
    const filteredNotices = allNotices.filter(notice => {
        if (!searchQuery) return true;
        return (notice.title && notice.title.toLowerCase().includes(searchQuery)) ||
            (notice.content && notice.content.toLowerCase().includes(searchQuery));
    });

    if (filteredNotices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-12 text-gray-400 bg-white">
                    ${searchQuery ? '검색 결과가 없습니다.' : '등록된 공지사항이 없습니다.'}
                </td>
            </tr>
        `;
        return;
    }

    const totalCount = filteredNotices.length;
    const adminUser = typeof isAdmin === 'function' ? isAdmin() : false;

    tbody.innerHTML = filteredNotices.map((notice, index) => {
        const displayNum = totalCount - index;

        // 작성자 정보 파싱
        const authorName = notice.author ? (notice.author.name || notice.author.username || '관리자') : (notice.authorName || '관리자');
        const dateStr = formatDate(notice.createdAt);

        const isNew = isNewPost(notice);
        const isPinned = notice.isPinned === true;

        return `
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer ${isPinned ? 'bg-blue-50/40 font-semibold' : ''}">
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs" onclick="goToNoticeDetail('${notice.id}')">
                    ${isPinned ? '<span class="text-blue-600 font-bold">📌</span>' : displayNum}
                </td>
                <td class="py-3.5 px-4 text-gray-900" onclick="goToNoticeDetail('${notice.id}')">
                    <div class="flex items-center gap-1.5">
                        ${isPinned ? '<span class="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">고정</span>' : ''}
                        <span class="hover:underline">${escapeHtml(notice.title)}</span>
                        ${notice.hasPoll ? `<span class="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5">📊 투표</span>` : ''}
                        ${isNew ? '<span class="badge-n">N</span>' : ''}
                    </div>
                </td>
                <td class="py-3.5 px-4 text-right text-gray-600 text-xs" onclick="goToNoticeDetail('${notice.id}')">
                    <div class="flex items-center justify-end gap-1.5">
                        ${adminUser ? `
                            <div class="flex items-center gap-1 mr-1" onclick="event.stopPropagation();">
                                <button 
                                    onclick="togglePinNotice(event, '${notice.id}')" 
                                    class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer ${isPinned ? 'text-blue-600 bg-blue-50' : ''}"
                                    title="${isPinned ? '고정 해제' : '게시물 고정'}"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                                    </svg>
                                </button>
                                <button 
                                    onclick="openDeleteModal(event, '${notice.id}')" 
                                    class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="공지 삭제"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                        <span>${escapeHtml(authorName)}</span>
                    </div>
                </td>
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs whitespace-nowrap" onclick="goToNoticeDetail('${notice.id}')">${dateStr}</td>
                <td class="py-3.5 px-4 text-center text-gray-500 text-xs whitespace-nowrap" onclick="goToNoticeDetail('${notice.id}')">${notice.views || 0}</td>
            </tr>
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

// 공지사항 삭제 최종 실행
async function executeDeleteNotice() {
    if (!targetNoticeIdToDelete) return;

    try {
        const response = await fetch(`/api/notices/${targetNoticeIdToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('공지사항 삭제 실패');

        closeDeleteModal();
        await loadNotices();
    } catch (error) {
        console.error('공지 삭제 오류:', error);
        alert('삭제 처리 중 오류가 발생했습니다.');
    }
}

// 상세 페이지 이동 시 서버 DB에 읽음 상태 반영 API 호출
async function goToNoticeDetail(noticeId) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const myId = user ? (user.id || user.username || user.userId || '') : '';

    if (myId) {
        try {
            await fetch(`/api/notices/${noticeId}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: myId })
            });
        } catch (e) {
            console.error('읽음 처리 전송 오류:', e);
        }
    }

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
    const authorName = user ? (user.name || user.username || user.id || '관리자') : '관리자';

    const postPayload = {
        title: title,
        content: content,
        author: authorName,
        hasPoll: false,
        isPinned: false
    };

    const attachPollCheck = document.getElementById('attach-poll-check');
    if (attachPollCheck && attachPollCheck.checked) {
        const questionInput = document.getElementById('poll-question').value.trim();
        const question = questionInput !== '' ? questionInput : title;

        const validOptions = noticePollOptions
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

        if (validOptions.length < 2) {
            if (typeof showError === 'function') showError('modal-error', '투표 선택지는 최소 2개 이상 입력해야 합니다.');
            return;
        }

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

        const createModal = document.getElementById('create-modal');
        if (createModal) createModal.classList.add('hidden');
        resetNoticeForm();

        await loadNotices();
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