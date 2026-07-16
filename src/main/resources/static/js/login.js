document.addEventListener('DOMContentLoaded', function() {
    // 이미 로그인 상태라면 메인으로 리다이렉트 (필요시 유지)
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const capsLockMessage = document.getElementById('caps-lock-message');

    function updateCapsLockState(event) {
        if (event.getModifierState('CapsLock')) {
            capsLockMessage.classList.remove('hidden');
        } else {
            capsLockMessage.classList.add('hidden');
        }
    }

    passwordInput.addEventListener('keydown', updateCapsLockState);
    passwordInput.addEventListener('keyup', updateCapsLockState);

    loginForm.addEventListener('submit', function(e) {
        // 1. 우선 기본 서브밋을 막고 벨리데이션을 진행합니다.
        e.preventDefault();
        hideError('error-message');

        const studentId = document.getElementById('studentId').value.trim();
        const password = document.getElementById('password').value;
        const strengthBar = document.getElementById('password-strength-bar');
        const strengthText = document.getElementById('password-strength-text');

        // 2. 유효성 검사 (입력 체크)
        if (!studentId || !password) {
            showError('error-message', '학번과 비밀번호를 모두 입력해주세요.');
            return;
        }

        if (studentId.length !== 8) {
            showError('error-message', '학번은 8자리여야 합니다.');
            return;
        }

        // 3. 임시 세션 발급을 위해 localStorage에 유저 정보 저장 (메인화면 UI 업데이트용)
        // 실제 운영 환경에서는 로그인 성공 후 서버에서 유저 정보를 받아와 기입해야 하지만,
        // 현재 index.html이나 main.js 구조가 localStorage 기반이므로 일단 가작성해 둡니다.
        const mockUser = {
            username: studentId + " 회원",
            studentId: studentId,
            department: "UbiCOM",
            isAdmin: false
        };
        localStorage.setItem('currentUser', JSON.stringify(mockUser));

        // 4. 모든 검증이 끝났으므로, 스프링 시큐리티 서버(/login)로 데이터를 전송합니다!
        loginForm.submit();
    });
});