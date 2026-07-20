// Main navigation and common functionality

// [★수정] 로그인 상태에 따라 상단 네비게이션 바를 업데이트하는 함수
function updateNavigation() {
    const navButtons = document.getElementById('nav-buttons');
    const mobileNavButtons = document.getElementById('mobile-nav-buttons');

    if (!navButtons) return;

    const user = getCurrentUser();

    if (user) {
        // 💡 이름에 학번(숫자)이 나오는 현상을 방지하는 안전장치
        const isStudentIdAsName = /^\d+$/.test(user.username);
        const displayName = (isStudentIdAsName && user.name) ? user.name : user.username;

        // 관리자용 메뉴 태그 생성
        const adminMenuHtml = user.isAdmin
            ? `<a onclick="location.href='/admin_members'" class="text-sm py-2 hover:text-blue-100 transition-colors cursor-pointer">동아리원 관리</a>`
            : '';

        // Desktop navigation (이름 왼쪽에 관리자 메뉴 삽입)
        navButtons.innerHTML = `
            <div class="flex items-center gap-4">
                ${adminMenuHtml}
                <a onclick="location.href='/profile'" class="text-sm hover:text-blue-100 transition-colors cursor-pointer">${displayName}님</a>
                <button onclick="logoutUser()" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    로그아웃
                </button>
            </div>
        `;

        // Mobile navigation
        if (mobileNavButtons) {
            mobileNavButtons.innerHTML = `
                ${adminMenuHtml}
                <a onclick="location.href='/profile'" class="text-sm py-2 hover:text-blue-100 transition-colors">${displayName}님</a>
                <button onclick="logoutUser()" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors w-full mt-2">
                    로그아웃
                </button>
            `;
        }
    }
    else {
        // Desktop navigation (로그아웃 상태)
        navButtons.innerHTML = `
            <div class="flex gap-2">
                <a onclick="location.href='/login'" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                    로그인
                </a>
                <button onclick="location.href='/register'" class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    회원가입
                </button>
            </div>
        `;

        // Mobile navigation
        if (mobileNavButtons) {
            mobileNavButtons.innerHTML = `
                <a onclick="location.href='/login'" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors text-center">
                    로그인
                </a>
                <button onclick="location.href='/register'" class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors text-center">
                    회원가입
                </button>
            `;
        }
    }
}

// Mobile menu toggle 및 초기화 설정
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // 1. 우선 로컬 스토리지에 있는 기존 정보로 빠르게 화면을 한 번 그립니다. (UI 깜빡임 방지)
    updateNavigation();
});

// [★핵심 추가] auth.js에서 세션 정보 검증이 완료되었을 때 즉시 UI를 새로 그립니다.
// 이 리스너가 있어야 사용자가 수동으로 새로고침을 안 해도 화면이 바로 전환됩니다!
window.addEventListener('authVerified', function() {
    updateNavigation();
});

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
        if (diffHours < 1) {
            const diffMinutes = Math.floor(diff / (1000 * 60));
            return `${diffMinutes}분 전`;
        }
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR');
    }
}

// Format full date
function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('hidden');
        errorElement.querySelector('p').textContent = message;
    }
}

// Hide error message
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// Check login before navigation (for protected links)
document.addEventListener('DOMContentLoaded', function() {
    const protectedLinks = document.querySelectorAll('a[href="notice.html"], a[href="calendar.html"], a[href="board.html"]');

    protectedLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!isLoggedIn()) {
                e.preventDefault();
                window.location.href = 'login.html';
            }
        });
    });
});