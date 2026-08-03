/* ==========================================
   UbiCOM Main Script
   - 네비게이션 상태 동기화 및 공통 유틸리티 함수
   ========================================== */

// 로그인 상태에 따라 상단 네비게이션 바 및 메뉴 전체를 업데이트하는 함수
function updateNavigation() {
    const mainNav = document.getElementById('main-nav');
    const mobileMainNav = document.getElementById('mobile-main-nav');
    const navButtons = document.getElementById('nav-buttons');
    const mobileNavButtons = document.getElementById('mobile-nav-buttons');

    if (!navButtons) return;

    const user = getCurrentUser();

    if (user) {
        // 이름에 학번(숫자)이 나오는 현상을 방지하는 안전장치
        const isStudentIdAsName = /^\d+$/.test(user.username);
        const displayName = (isStudentIdAsName && user.name) ? user.name : user.username;

        // 관리자용 메뉴 태그 생성
        const adminMenuHtml = user.isAdmin
            ? `<a onclick="location.href='/admin_members'" class="hover:text-blue-100 transition-colors cursor-pointer">동아리원 관리</a>`
            : '';

        // 로그인 상태일 때 메인 메뉴들(공지사항, 학사일정, 게시판, 투표) 노출
        if (mainNav) {
            mainNav.innerHTML = `
                <a onclick="location.href='/notice'" class="hover:text-blue-100 transition-colors cursor-pointer">공지사항</a>
                <a onclick="location.href='/calendar'" class="hover:text-blue-100 transition-colors cursor-pointer">학사일정</a>
                <a onclick="location.href='/board'" class="hover:text-blue-100 transition-colors cursor-pointer">게시판</a>
                <a onclick="location.href='/vote'" class="hover:text-blue-100 transition-colors cursor-pointer">투표</a>
            `;
        }

        // Desktop User Profile & Logout
        navButtons.innerHTML = `
            <div class="flex items-center gap-4">
                ${adminMenuHtml}
                <a onclick="location.href='/profile'" class="text-sm hover:text-blue-100 transition-colors cursor-pointer">${displayName}님</a>
                <button onclick="logoutUser()" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                    로그아웃
                </button>
            </div>
        `;

        // Mobile Main Menu
        if (mobileMainNav) {
            mobileMainNav.innerHTML = `
                <a onclick="location.href='/notice'" class="py-2 hover:text-blue-100 transition-colors cursor-pointer">공지사항</a>
                <a onclick="location.href='/calendar'" class="py-2 hover:text-blue-100 transition-colors cursor-pointer">학사일정</a>
                <a onclick="location.href='/board'" class="py-2 hover:text-blue-100 transition-colors cursor-pointer">게시판</a>
                <a onclick="location.href='/vote'" class="py-2 hover:text-blue-100 transition-colors cursor-pointer">투표</a>
                ${user.isAdmin ? `<a onclick="location.href='/admin_members'" class="py-2 hover:text-blue-100 transition-colors cursor-pointer">동아리원 관리</a>` : ''}
            `;
        }

        // Mobile Logout
        if (mobileNavButtons) {
            mobileNavButtons.innerHTML = `
                <a onclick="location.href='/profile'" class="text-sm py-2 hover:text-blue-100 transition-colors cursor-pointer">${displayName}님</a>
                <button onclick="logoutUser()" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors w-full mt-2 cursor-pointer">
                    로그아웃
                </button>
            `;
        }
    }
    else {
        // 비로그인 상태일 때는 주요 메뉴 영역 숨김
        if (mainNav) mainNav.innerHTML = '';
        if (mobileMainNav) mobileMainNav.innerHTML = '';

        // Desktop navigation (로그인 / 회원가입 버튼만 노출)
        navButtons.innerHTML = `
            <div class="flex gap-2">
                <a onclick="location.href='/login'" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                    로그인
                </a>
                <button onclick="location.href='/register'" class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                    회원가입
                </button>
            </div>
        `;

        // Mobile navigation (로그인 / 회원가입 버튼만 노출)
        if (mobileNavButtons) {
            mobileNavButtons.innerHTML = `
                <a onclick="location.href='/login'" class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors text-center cursor-pointer">
                    로그인
                </a>
                <button onclick="location.href='/register'" class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors text-center cursor-pointer">
                    회원가입
                </button>
            `;
        }
    }
}

// 📌 [디버깅 추가] 모바일 메뉴 버튼 클릭 감지 이벤트 위임
document.addEventListener('click', function(e) {
    const mobileMenuBtn = e.target.closest('#mobile-menu-btn');
    if (mobileMenuBtn) {
        console.log("✅ 모바일 메뉴 버튼 클릭됨!");
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
            console.log("📂 모바일 메뉴 토글 완료. 현재 상태:", mobileMenu.className);
        } else {
            console.error("❌ 오류: HTML에 'mobile-menu' ID를 가진 요소가 없습니다!");
        }
    }
});

// 초기 네비게이션 렌더링 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation);
} else {
    updateNavigation();
}

// auth.js에서 세션 정보 검증이 완료되었을 때 즉시 UI를 새로 그림
window.addEventListener('authVerified', function() {
    updateNavigation();
});

// 날짜 포맷 헬퍼 함수
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

// 상세 날짜 포맷 함수
function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
}

// 에러 메시지 표시
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('hidden');
        const p = errorElement.querySelector('p');
        if (p) p.textContent = message;
    }
}

// 에러 메시지 숨김
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// 보호된 메뉴 클릭 시 로그인 여부 체크
function initProtectedLinks() {
    const protectedLinks = document.querySelectorAll('a[href="/notice"], a[href="/calendar"], a[href="/board"], a[href="/vote"]');

    protectedLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!isLoggedIn()) {
                e.preventDefault();
                alert('로그인이 필요한 서비스입니다.');
                window.location.href = '/login';
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProtectedLinks);
} else {
    initProtectedLinks();
}