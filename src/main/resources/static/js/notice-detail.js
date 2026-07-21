// Notice detail page functionality

let currentNotice = null;
let currentNoticeId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;

    // Get notice ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentNoticeId = urlParams.get('id');

    if (!currentNoticeId) {
        window.location.href = '/notice';
        return;
    }

    incrementViews();
    loadNotice();
});

// 조회수 증가 함수
function incrementViews() {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    const noticeIndex = notices.findIndex(n => n.id === currentNoticeId);

    if (noticeIndex !== -1) {
        notices[noticeIndex].views = (notices[noticeIndex].views || 0) + 1;
        localStorage.setItem('notices', JSON.stringify(notices));
    }
}

function loadNotice() {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    const notice = notices.find(n => n.id === currentNoticeId);

    if (!notice) {
        document.getElementById('notice-content').innerHTML = `
            <div class="p-12 text-center">
                <p class="text-gray-500 mb-4">공지사항을 찾을 수 없습니다.</p>
                <button onclick="window.location.href='/notice'" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                    공지사항 목록으로 돌아가기
                </button>
            </div>
        `;
        return;
    }

    currentNotice = notice;
    const userIsAdmin = isAdmin(); // 관리자 여부 확인

    document.getElementById('notice-content').innerHTML = `
        <div class="p-6">
            <div class="flex items-start justify-between gap-4 mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">공지</span>
                        ${notice.isImportant ? `<span class="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">중요</span>` : ''}
                    </div>
                    <h1 class="text-3xl font-bold">${escapeHtml(notice.title)}</h1>
                </div>
                ${userIsAdmin ? `
                    <button onclick="deleteNotice()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm shrink-0">
                        삭제
                    </button>
                ` : ''}
            </div>
            
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>${escapeHtml(notice.author || '관리자')}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>${formatFullDate(notice.createdAt)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span>조회 ${notice.views || 0}</span>
                </div>
            </div>
            
            <div class="prose max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed min-h-[200px]">
                ${escapeHtml(notice.content)}
            </div>
        </div>
    `;
}

function deleteNotice() {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
        return;
    }

    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    const filteredNotices = notices.filter(n => n.id !== currentNoticeId);
    localStorage.setItem('notices', JSON.stringify(filteredNotices));

    window.location.href = '/notice';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}