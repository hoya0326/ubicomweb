// login.js
document.addEventListener('DOMContentLoaded', function() {
    // 💡 1. URL 파라미터에 error가 포함되어 있다면 로그인 실패 에러 메시지 노출
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        // 백엔드에서 전달된 custom message가 있다면 표시하고, 없으면 기본 메시지 노출
        const errorMsg = urlParams.get('message') || '학번 또는 비밀번호가 일치하지 않습니다.';
        showError('error-message', decodeURIComponent(errorMsg));
    }

    // 이미 로그인된 정상 상태라면 메인으로 리다이렉트 (error 파라미터가 없을 때만)
    if (isLoggedIn() && !urlParams.has('error')) {
        window.location.href = '/';
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
        hideError('error-message');

        const studentId = document.getElementById('studentId').value.trim();
        const password = document.getElementById('password').value;

        // 유효성 검사 (입력 체크)
        if (!studentId || !password) {
            e.preventDefault(); // 폼 제출 중단
            showError('error-message', '학번과 비밀번호를 모두 입력해주세요.');
            return;
        }

        if (studentId.length !== 8) {
            e.preventDefault(); // 폼 제출 중단
            showError('error-message', '학번은 8자리여야 합니다.');
            return;
        }



        // e.preventDefault()가 호출되지 않았으므로 action="/login"으로 정상 제출됩니다.
    });
});