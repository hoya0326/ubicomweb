// Notice page functionality

let currentNoticeId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;
    
    // Show admin controls if user is admin
    if (isAdmin()) {
        document.getElementById('admin-controls').classList.remove('hidden');
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
    
    closeModal.addEventListener('click', function() {
        createModal.classList.add('hidden');
        document.getElementById('create-notice-form').reset();
        hideError('modal-error');
    });
    
    cancelBtn.addEventListener('click', function() {
        createModal.classList.add('hidden');
        document.getElementById('create-notice-form').reset();
        hideError('modal-error');
    });
    
    // Create notice form
    const createNoticeForm = document.getElementById('create-notice-form');
    createNoticeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCreateNotice();
    });
    
    // View modal
    const closeViewModal = document.getElementById('close-view-modal');
    closeViewModal.addEventListener('click', function() {
        document.getElementById('view-modal').classList.add('hidden');
        currentNoticeId = null;
    });
    
    // Delete button
    const deleteNoticeBtn = document.getElementById('delete-notice-btn');
    deleteNoticeBtn.addEventListener('click', function() {
        if (currentNoticeId) {
            deleteNotice(currentNoticeId);
        }
    });
});

function loadNotices() {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    
    // Sort by date (newest first)
    notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const noticesList = document.getElementById('notices-list');
    
    if (notices.length === 0) {
        noticesList.innerHTML = `
            <div class="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                아직 작성된 공지사항이 없습니다.
            </div>
        `;
        return;
    }
    
    noticesList.innerHTML = notices.map(notice => `
        <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6" onclick="viewNotice('${notice.id}')">
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
                    <span>${formatDate(notice.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
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
        createdAt: new Date().toISOString()
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

function viewNotice(noticeId) {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    const notice = notices.find(n => n.id === noticeId);
    
    if (!notice) return;
    
    currentNoticeId = noticeId;
    
    document.getElementById('view-title').textContent = notice.title;
    document.getElementById('view-author').textContent = notice.author;
    document.getElementById('view-date').textContent = formatFullDate(notice.createdAt);
    document.getElementById('view-content').textContent = notice.content;
    
    // Show delete button for admin
    if (isAdmin()) {
        document.getElementById('delete-section').classList.remove('hidden');
    } else {
        document.getElementById('delete-section').classList.add('hidden');
    }
    
    document.getElementById('view-modal').classList.remove('hidden');
}

function deleteNotice(noticeId) {
    if (!requireAdmin()) return;
    
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
        return;
    }
    
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    const filteredNotices = notices.filter(n => n.id !== noticeId);
    localStorage.setItem('notices', JSON.stringify(filteredNotices));
    
    // Close modal and reload
    document.getElementById('view-modal').classList.add('hidden');
    currentNoticeId = null;
    loadNotices();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
