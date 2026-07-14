// Register page functionality

document.addEventListener('DOMContentLoaded', function() {
    // 1. 이미 로그인된 상태인지 확인 (auth.js의 isLoggedIn 함수 안전하게 체크)
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const registerForm = document.getElementById('register-form');

    // 💡 화면에 에러 메시지를 보여주는 자체 함수 (외부 파일에 의존하지 않음)
    function displayError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.classList.remove('hidden'); // 에러창 보이기 (Tailwind CSS)
            const errorText = errorDiv.querySelector('p');
            if (errorText) {
                errorText.textContent = message;
            }
        }
    }

    // 💡 에러 메시지 창을 숨기는 자체 함수
    function clearError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.classList.add('hidden'); // 에러창 숨기기 (Tailwind CSS)
        }
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 기본 submit 작동 중단
            clearError();       // 이전 에러 흔적 숨기기

            const name = document.getElementById('name').value.trim();
            const studentId = document.getElementById('studentId').value.trim();
            const department = document.getElementById('department').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // 1. 빈 값 및 학과 검증
            if (!name || !studentId || !password || !confirmPassword) {
                displayError('모든 필드를 입력해주세요.');
                return;
            }

            if (!department || department === "") {
                displayError('학과를 선택해주세요.');
                return;
            }

            // 2. 학번 검증
            if (studentId.length !== 8) {
                displayError('학번은 8자리여야 합니다.');
                return;
            }

            if (!/^\d{8}$/.test(studentId)) {
                displayError('학번은 숫자만 입력 가능합니다.');
                return;
            }

            // 3. 비밀번호 길이 검증
            if (password.length < 6) {
                displayError('비밀번호는 최소 6자 이상이어야 합니다.');
                return;
            }

            // 4. 비밀번호 일치 검증
            if (password !== confirmPassword) {
                displayError('비밀번호가 일치하지 않습니다.');
                return;
            }

            // 5. [최종 교체] 가입 요청 진행
            if (typeof registerUser === 'function') {
                // 검증을 무사히 통과했으므로 실제 HTML Form 객체 자체를 전달하여 제출시킵니다.
                registerUser(registerForm);
            } else {
                // 혹시 모를 대체 작동용
                const studentIdInput = document.getElementById('studentId');
                const departmentSelect = document.getElementById('department');
                if (studentIdInput) studentIdInput.name = 'userid';
                if (departmentSelect) departmentSelect.name = 'major';
                registerForm.action = '/member';
                registerForm.submit();
            }
        });
    }
});