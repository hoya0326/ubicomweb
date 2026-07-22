// Authentication utilities (Spring Security & DB Integrated)
//auth.js

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

// 3. 현재 유저가 관리자인지 확인 (허용할 관리자 학번 배열 지정)
function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;

    // DB에서 보낸 isAdmin 플래그가 true이거나, 지정된 관리자 학번에 해당하는지 교차 검증
    const adminIds = [20233244, 20233293];
    const userStudentId = parseInt(user.studentId);

    return user.isAdmin === true || adminIds.includes(userStudentId);
}

// 4. [★수정] 백엔드 세션을 조회하고, 화면 그리기를 강제 동기화하는 함수
function verifyAuthentication() {
    return fetch('/api/user?t=' + Date.now(), { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const wasLoggedInBefore = !!localStorage.getItem('currentUser');

            if (data.isLoggedIn) {
                const adminIds = [20233244, 20233293];
                const studentIdInt = parseInt(data.studentId);

                // 💡 [해결 포인트] 백엔드가 이름 필드(data.name)를 주면 그것을 쓰고, 없으면 data.username을 씁니다.
                // 스프링 시큐리티에서 Principal로 학번을 쓸 때 이름 자리에 학번이 들어가는 문제를 방지합니다.
                const realName = data.name || data.username;

                const currentUser = {
                    username: realName,
                    studentId: data.studentId,
                    department: data.department,
                    isAdmin: data.isAdmin || adminIds.includes(studentIdInt)
                };

                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                // 💡 중요: 인증 정보를 갱신하자마자 이벤트를 발생시켜 main.js가 알 수 있도록 합니다.
                window.dispatchEvent(new CustomEvent('authVerified', { detail: currentUser }));

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

// 5. 로그인 처리 후 곧바로 동기화 및 페이지 이동 유도
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
            // 로그인 직후 비동기로 세션 정보를 확실하게 받아와 로컬스토리지를 갱신합니다.
            const verifyResult = await verifyAuthentication();

            if (verifyResult.success) {
                // 로그인이 성공하면 메인 페이지로 이동시켜 자연스럽게 화면을 다시 로드하도록 합니다.
                window.location.href = 'index.html';
            }
            return { success: true, user: verifyResult.user };
        } else {
            return { success: false, error: '학번 또는 비밀번호가 일치하지 않습니다.' };
        }
    } catch (error) {
        return { success: false, error: '서버와 통신 중 오류가 발생했습니다.' };
    }
}

// 6. 실제 페이지의 Form 엘리먼트를 직접 받아 전송합니다.
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

// 페이지가 로드될 때 항상 백엔드와 세션을 동기화합니다.
document.addEventListener('DOMContentLoaded', function() {
    verifyAuthentication();
});

// 브라우저가 뒤로가기나 화면 전환으로 이전 스냅샷(bfcache)을 복원했을 때도 캐시를 새로고침합니다.
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        verifyAuthentication();
    }
});