// Authentication utilities (Spring Security & DB Integrated)

// [변경] 관리자 초기화는 이제 스프링 부트(백엔드/DB)가 수행하므로 프론트엔드에서는 제거하거나 비워둡니다.
function initializeAdmin() {
    console.log("Admin initialization is now handled by the Spring Boot backend.");
}

// 1. 현재 로그인 여부 확인 (로컬 캐시 기준 - UI 깜빡임 방지용)
function isLoggedIn() {
    return !!localStorage.getItem('currentUser');
}

// 2. 현재 로그인된 유저 정보 가져오기 (로컬 캐시 기준)
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
    return user && user.isAdmin === true;
}

// 4. [★최종 마법의 수정] 백엔드 세션을 조회하고, 화면 그리기를 강제 동기화하는 함수
function verifyAuthentication() {
    return fetch('/api/user?t=' + Date.now(), { cache: 'no-store' })
        .then(response => response.json())
        .then(data => {
            // [핵심] 현재 비동기 검사를 하기 "직전"의 로컬 스토리지 로그인 여부를 백업합니다.
            const wasLoggedInBefore = !!localStorage.getItem('currentUser');

            if (data.isLoggedIn) {
                // 스프링 세션이 살아있다면 백엔드 정보로 캐시 갱신
                const currentUser = {
                    username: data.username,
                    studentId: data.studentId,
                    department: data.department,
                    isAdmin: data.isAdmin || false
                };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                window.dispatchEvent(new CustomEvent('authVerified', { detail: currentUser }));

                // ★ [핵심 로직] 백엔드는 로그인 상태인데, 로컬 스토리지는 비어있었다면? (방금 로그인하고 들어온 순간)
                // main.js와 home.js가 최신 로컬 스토리지를 읽고 화면을 다시 그리도록 딱 한 번 자동으로 새로고침합니다.
                if (!wasLoggedInBefore) {
                    window.location.reload();
                    return { success: true, user: currentUser }; // 실행 중단
                }

                return { success: true, user: currentUser };
            } else {
                // 세션이 없다면 캐시 삭제
                localStorage.removeItem('currentUser');
                window.dispatchEvent(new CustomEvent('authVerified', { detail: null }));

                // ★ [핵심 로직] 백엔드는 로그아웃 상태인데, 로컬 스토리지에는 옛날 정보가 남아있었다면? (방금 로그아웃한 순간)
                if (wasLoggedInBefore) {
                    window.location.reload();
                    return { success: false };
                }

                return { success: false };
            }
        })
        .catch(error => {
            console.error('인증 상태 검증 실패:', error);
            const wasLoggedInBefore = !!localStorage.getItem('currentUser');
            localStorage.removeItem('currentUser');
            window.dispatchEvent(new CustomEvent('authVerified', { detail: null }));

            if (wasLoggedInBefore) {
                window.location.reload();
            }
            return { success: false, error };
        });
}

// 5. [변경] 로그인 처리 (스프링 시큐리티 폼 로그인 또는 AJAX 호출)
async function loginUser(studentId, password) {
    try {
        const formData = new URLSearchParams();
        formData.append('username', studentId);
        formData.append('password', password);

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok || response.redirected) {
            // 로그인이 성공했으므로 백엔드로부터 유저 정보를 새로고침 받아 캐싱합니다.
            const verifyResult = await verifyAuthentication();
            return { success: true, user: verifyResult.user };
        } else {
            return { success: false, error: '학번 또는 비밀번호가 일치하지 않습니다.' };
        }
    } catch (error) {
        return { success: false, error: '서버와 통신 중 오류가 발생했습니다.' };
    }
}

// 6. [최종 교체] 실제 페이지의 Form 엘리먼트를 직접 받아 전송합니다.
function registerUser(formElement) {
    try {
        // 기존 register-form의 input 태그 이름(name)을 백엔드가 이해하는 매개변수명으로 일시 변환합니다.
        const nameInput = formElement.querySelector('#name');
        const studentIdInput = formElement.querySelector('#studentId');
        const departmentSelect = formElement.querySelector('#department');
        const passwordInput = formElement.querySelector('#password');

        // 백엔드 컨트롤러의 변수명 (name, userid, major, password) 에 맞춰 name 속성 부여
        if (nameInput) nameInput.name = 'name';
        if (studentIdInput) studentIdInput.name = 'userid'; // 💡 'studentId' -> 'userid'
        if (departmentSelect) departmentSelect.name = 'major'; // 💡 'department' -> 'major'
        if (passwordInput) passwordInput.name = 'password';

        // 백엔드 엔드포인트 주소 설정 후 제출
        formElement.action = '/member';
        formElement.method = 'POST';
        formElement.submit();

        return { success: true };
    } catch (error) {
        return { success: false, error: '서버와 통신 중 오류가 발생했습니다.' };
    }
}

// 7. [변경] 로그아웃 처리
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = '/logout';
}

// 8. 페이지 보호 (로그인 체크)
function requireLogin() {
    if (!isLoggedIn()) {
        alert('로그인이 필요한 서비스입니다.');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 9. 페이지 보호 (관리자 체크)
function requireAdmin() {
    if (!isAdmin()) {
        alert('관리자만 접근할 수 있습니다.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// [수정] 페이지가 로드될 때 항상 백엔드와 세션을 동기화합니다.
document.addEventListener('DOMContentLoaded', function() {
    verifyAuthentication();
});

// [추가] 브라우저가 뒤로가기나 화면 전환으로 이전 스냅샷(bfcache)을 복원했을 때도 캐시를 새로고침합니다.
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        verifyAuthentication();
    }
});