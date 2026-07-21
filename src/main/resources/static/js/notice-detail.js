// Notice Detail functionality

let currentNotice = null;
let currentPoll = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;

    // URL 파라미터에서 공지 ID 가져오기 (?id=12345)
    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get('id');

    if (!noticeId) {
        alert('잘못된 접근입니다.');
        window.location.href = '/notice';
        return;
    }

    loadNoticeDetail(noticeId);

    // 삭제 모달 '삭제하기' 버튼 이벤트 등록
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', executeDeleteCurrentNotice);
    }
});

function loadNoticeDetail(noticeId) {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    currentNotice = notices.find(n => n.id === noticeId);

    if (!currentNotice) {
        alert('존재하지 않거나 삭제된 공지사항입니다.');
        window.location.href = '/notice';
        return;
    }

    // 관리자인 경우 상단 삭제 버튼 표시 (쓰레기통 아이콘 스타일)
    if (isAdmin()) {
        const actionsContainer = document.getElementById('notice-actions');
        if (actionsContainer) {
            actionsContainer.innerHTML = `
                <button 
                    onclick="openDeleteModal()" 
                    class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium border border-gray-200"
                    title="공지사항 삭제"
                >
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    <span>삭제</span>
                </button>
            `;
        }
    }

    // 조회수 증가 처리
    currentNotice.views = (currentNotice.views || 0) + 1;
    localStorage.setItem('notices', JSON.stringify(notices));

    // 공지 정보 렌더링
    document.getElementById('notice-title').textContent = currentNotice.title;
    document.getElementById('notice-content').textContent = currentNotice.content;
    document.getElementById('notice-author').textContent = `작성자: ${currentNotice.author || '관리자'}`;
    document.getElementById('notice-date').textContent = `작성일: ${typeof formatDate === 'function' ? formatDate(currentNotice.createdAt) : currentNotice.createdAt.split('T')[0]}`;
    document.getElementById('notice-views').textContent = `조회수: ${currentNotice.views}`;

    // 첨부된 투표가 있는 경우 투표 불러오기
    if (currentNotice.hasPoll) {
        loadAttachedPoll(noticeId);
    }
}

// 커스텀 삭제 모달 열기
function openDeleteModal() {
    if (!isAdmin()) {
        alert('관리자 권한이 필요합니다.');
        return;
    }
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('hidden');
}

// 커스텀 삭제 모달 닫기
function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('hidden');
}

// 상세 페이지에서 현재 공지 삭제 최종 실행
function executeDeleteCurrentNotice() {
    if (!currentNotice) return;

    const noticeId = currentNotice.id;

    // 1. 공지사항 데이터 삭제
    let notices = JSON.parse(localStorage.getItem('notices') || '[]');
    notices = notices.filter(n => n.id !== noticeId);
    localStorage.setItem('notices', JSON.stringify(notices));

    // 2. 첨부된 투표 데이터 삭제
    let polls = JSON.parse(localStorage.getItem('polls') || '[]');
    polls = polls.filter(p => p.noticeId !== noticeId);
    localStorage.setItem('polls', JSON.stringify(polls));

    closeDeleteModal();
    window.location.href = '/notice';
}

// 첨부된 투표 불러오기
function loadAttachedPoll(noticeId) {
    const polls = JSON.parse(localStorage.getItem('polls') || '[]');
    currentPoll = polls.find(p => p.noticeId === noticeId);

    const pollSection = document.getElementById('notice-poll-section');
    if (!pollSection || !currentPoll) return;

    renderNoticePoll();
}

// 투표 화면 렌더링
function renderNoticePoll() {
    const pollSection = document.getElementById('notice-poll-section');
    if (!pollSection || !currentPoll) return;

    const user = getCurrentUser();
    const userId = user ? user.id : null;

    // 마감 여부 확인
    const isExpired = currentPoll.expiresAt && new Date() > new Date(currentPoll.expiresAt);

    // 내가 이미 투표했는지 확인
    const userVotes = currentPoll.votes ? currentPoll.votes.filter(v => v.userId === userId) : [];
    const myVotedOptionIds = userVotes.map(v => v.optionId);

    // 전체 투표수 계산
    const totalVotesCount = currentPoll.votes ? currentPoll.votes.length : 0;

    pollSection.innerHTML = `
        <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h3 class="text-lg font-bold text-gray-900">
                            📊 <span>${escapeHtml(currentPoll.question || currentPoll.title)}</span>
                        </h3>
                        ${isExpired ? '<span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">마감됨</span>' : ''}
                    </div>
                    <span class="text-xs text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full font-medium">
                        총 ${totalVotesCount}명 참여
                    </span>
                </div>

                ${currentPoll.expiresAt ? `
                    <div class="text-xs text-gray-500 mb-3">
                        ⏰ 마감일시: ${new Date(currentPoll.expiresAt).toLocaleString('ko-KR')}
                    </div>
                ` : ''}

                <form id="notice-poll-form" onsubmit="submitNoticeVote(event)" class="space-y-3 mb-4">
                    ${currentPoll.options.map(option => {
        const optionVotes = currentPoll.votes ? currentPoll.votes.filter(v => v.optionId === option.id).length : 0;
        const percent = totalVotesCount > 0 ? Math.round((optionVotes / totalVotesCount) * 100) : 0;
        const isChecked = myVotedOptionIds.includes(option.id);

        return `
                            <label class="block bg-white p-3 rounded-md border ${isChecked ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} ${isExpired ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-blue-300'} transition-all">
                                <div class="flex items-center justify-between mb-1">
                                    <div class="flex items-center gap-2">
                                        <input 
                                            type="${currentPoll.allowMultiple ? 'checkbox' : 'radio'}" 
                                            name="poll-option" 
                                            value="${option.id}"
                                            ${isChecked ? 'checked' : ''}
                                            ${isExpired ? 'disabled' : ''}
                                            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        >
                                        <span class="text-sm font-medium text-gray-800">${escapeHtml(option.text)}</span>
                                    </div>
                                    <span class="text-xs font-semibold text-gray-500">${percent}% (${optionVotes}표)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${percent}%"></div>
                                </div>
                            </label>
                        `;
    }).join('')}

                    <div class="flex justify-between items-center pt-2">
                        <span class="text-xs text-gray-500">
                            ${currentPoll.allowMultiple ? '※ 복수 선택이 가능합니다.' : '※ 단일 선택 투표입니다.'}
                        </span>
                        <button 
                            type="submit" 
                            ${isExpired ? 'disabled' : ''}
                            class="${isExpired ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-medium px-5 py-2 rounded-md transition-colors"
                        >
                            ${isExpired ? '마감된 투표입니다' : (myVotedOptionIds.length > 0 ? '투표 변경하기' : '투표하기')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// 투표 제출 처리
function submitNoticeVote(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }

    if (currentPoll.expiresAt && new Date() > new Date(currentPoll.expiresAt)) {
        alert('마감된 투표입니다.');
        return;
    }

    const form = document.getElementById('notice-poll-form');
    const selectedInputs = form.querySelectorAll('input[name="poll-option"]:checked');

    if (selectedInputs.length === 0) {
        alert('최소 하나의 옵션을 선택해 주세요.');
        return;
    }

    const selectedOptionIds = Array.from(selectedInputs).map(input => input.value);

    // 기존 내 투표 내역 삭제 후 재등록
    const polls = JSON.parse(localStorage.getItem('polls') || '[]');
    const pollIndex = polls.findIndex(p => p.id === currentPoll.id);

    if (pollIndex === -1) return;

    let votes = polls[pollIndex].votes || [];
    // 내 기존 투표 삭제
    votes = votes.filter(v => v.userId !== user.id);

    // 새 투표 추가
    selectedOptionIds.forEach(optId => {
        votes.push({
            userId: user.id,
            userName: user.username,
            optionId: optId,
            votedAt: new Date().toISOString()
        });
    });

    polls[pollIndex].votes = votes;
    localStorage.setItem('polls', JSON.stringify(polls));

    currentPoll = polls[pollIndex];
    alert('투표가 반영되었습니다.');
    renderNoticePoll();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}