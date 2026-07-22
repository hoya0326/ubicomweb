// Authentication utilities (Spring Security & DB Integrated)
// auth.js

// [변경] 관리자 초기화는 백엔드에서 수행
function initializeAdmin() {
    console.log("Admin initialization is now handled by the Spring Boot backend.");
}

// 1. 현재 로그인 여부 확인 (로컬 캐시 기준)
function isLoggedIn() {
    return !!localStorage.getItem('currentUser');
}

// 2. 현재 로그인된 유저 정보 가져오기
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    try {
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

// 3. 현재 유저가 관리자인지 확인
function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;

    const adminIds = [20233244, 20233293];
    const userStudentId = parseInt(user.studentId);

    return user.isAdmin === true || adminIds.includes(userStudentId);
}

// 4. 백엔드 세션을 조회하고, 화면 그리기를 강제 동기화하는 함수
function verifyAuthentication() {
    return fetch('/api/user?t=' + Date.now(), { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                return { isLoggedIn: false };
            }
            return response.json();
        })
        .then(data => {
            if (data && data.isLoggedIn) {
                const adminIds = [20233244, 20233293];
                const studentIdInt = parseInt(data.studentId);
                const realName = data.name || data.username;

                const currentUser = {
                    username: realName,
                    studentId: data.studentId,
                    department: data.department,
                    email: data.email || '', // ★ 이메일 필드 저장
                    isAdmin: data.isAdmin || adminIds.includes(studentIdInt)
                };

                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                window.dispatchEvent(new CustomEvent('authVerified', { detail: currentUser }));

                // 💡 [핵심] 로그인된 상태인데 이메일이 없고, 현재 위치가 /email 페이지가 아니라면 리다이렉트
                const currentPath = window.location.pathname.toLowerCase();
                const isEmailPage = currentPath.includes('/email');
                const isLoginPage = currentPath.includes('/login');

                if ((!data.email || data.email.trim() === '') && !isEmailPage && !isLoginPage) {
                    window.location.href = '/email'; // 원하시는 /email 경로로 이동
                    return { success: true, user: currentUser, redirected: true };
                }

                return { success: true, user: currentUser };
            } else {
                localStorage.removeItem('currentUser');
                window.dispatchEvent(new CustomEvent('authVerified', { detail: null }));
                return { success: false };
            }
        })
        .catch(error => {
            console.error('인증 상태 검증 실패:', error);
            localStorage.removeItem('currentUser');
            window.dispatchEvent(new CustomEvent('authVerified', { detail: null }));
            return { success: false, error };
        });
}

// 5. 로그인 처리 (SecurityConfig의 usernameParameter("userid")에 필드명 맞춤)
async function loginUser(studentId, password) {
    try {
        const formData = new URLSearchParams();
        // ★ SecurityConfig의 .usernameParameter("userid")와 이름을 똑같이 맞춰줍니다.
        formData.append('userid', studentId);
        formData.append('password', password);

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok || response.redirected) {
            const verifyResult = await verifyAuthentication();

            if (verifyResult.success) {
                window.location.href = '/';
            }
            return { success: true, user: verifyResult.user };
        } else {
            return { success: false, error: '학번 또는 비밀번호가 일치하지 않습니다.' };
        }
    } catch (error) {
        return { success: false, error: '서버와 통신 중 오류가 발생했습니다.' };
    }
}

// 6. 회원가입 처리
function registerUser(formElement) {
    try {
        const nameInput = formElement.querySelector('#name');
        const studentIdInput = formElement.querySelector('#studentId');
        const departmentSelect = formElement.querySelector('#department');
        const passwordInput = formElement.querySelector('#password');

        if (nameInput) nameInput.name = 'name';
        if (studentIdInput) studentIdInput.name = 'userid';
        if (departmentSelect) departmentSelect.name = 'major';
        if (passwordInput) passwordInput.name = 'password';

        formElement.action = '/member';
        formElement.method = 'POST';
        formElement.submit();

        return { success: true };
    } catch (error) {
        return { success: false, error: '서버와 통신 중 오류가 발생했습니다.' };
    }
}

// 7. 로그아웃 처리
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = '/logout';
}

// 8. 페이지 보호 (★ 비로그인 시 회원가입 및 로그인 페이지 진입을 강력하게 완하여 허용)
function requireLogin() {
    const path = window.location.pathname.toLowerCase();

    // 메인(/), 로그인(/login), 회원가입(/register) 경로는 로그인 여부 체크를 전면 건너뜁니다.
    if (
        path === '/' ||
        path === '' ||
        path.includes('/login') ||
        path.includes('/register') ||
        path.includes('/email') ||
        path.includes('/apply') ||
        path.includes('login.html') ||
        path.includes('register.html')

    ) {
        return true;
    }

    // 그 외 회원 전용 페이지(/notice, /board 등)에만 비로그인 체크 적용
    if (!isLoggedIn()) {
        alert('로그인이 필요한 서비스입니다.');
        window.location.href = '/login';
        return false;
    }
    return true;
}

// 9. 페이지 보호 (관리자 체크)
function requireAdmin() {
    if (!isAdmin()) {
        alert('관리자만 접근할 수 있습니다.');
        window.location.href = '/';
        return false;
    }
    return true;
}

// 페이지가 로드될 때 세션 동기화 및 페이지 권한 검사 진행
document.addEventListener('DOMContentLoaded', function() {
    // 1. 현재 주소가 회원 전용 페이지인지 확인 후 알림 창 띄우기
    requireLogin();

    // 2. 백엔드 세션 동기화
    verifyAuthentication();
});

// 브라우저 뒤로가기/앞으로가기 스냅샷 복원 시 세션 동기화
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        verifyAuthentication();
    }
});