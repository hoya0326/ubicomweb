// register.js - 회원가입 페이지 전용 스크립트

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm') || document.querySelector('form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    const passwordMatchMsg = document.getElementById('passwordMatchMsg');

    // 1. 비밀번호 실시간 보안 수준(강도) 측정
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const val = passwordInput.value;
            let score = 0;

            if (val.length >= 6) score++;
            if (/[A-Za-z]/.test(val) && /\d/.test(val)) score++;
            if (val.length >= 8 && /[^A-Za-z0-9]/.test(val)) score++;

            if (val.length === 0) {
                strengthBar.style.width = '0%';
                strengthBar.style.background = 'transparent';
                strengthText.textContent = '비밀번호 보안 수준';
                strengthText.style.color = '#9ca3af';
            } else if (score <= 1) {
                strengthBar.style.width = '33%';
                strengthBar.style.background = '#ef4444';
                strengthText.textContent = '약함 (숫자+영문 조합 필요)';
                strengthText.style.color = '#dc2626';
            } else if (score === 2) {
                strengthBar.style.width = '66%';
                strengthBar.style.background = '#eab308';
                strengthText.textContent = '보통';
                strengthText.style.color = '#ca8a04';
            } else {
                strengthBar.style.width = '100%';
                strengthBar.style.background = '#22c55e';
                strengthText.textContent = '강함';
                strengthText.style.color = '#16a34a';
            }

            checkPasswordMatch();
        });
    }

    // 2. 비밀번호 재확인 실시간 검증
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }

    function checkPasswordMatch() {
        if (!confirmPasswordInput || !passwordMatchMsg) return;

        const pass = passwordInput ? passwordInput.value : '';
        const confirmPass = confirmPasswordInput.value;

        if (confirmPass.length === 0) {
            passwordMatchMsg.textContent = '';
            passwordMatchMsg.style.display = 'none';
            return;
        }

        passwordMatchMsg.style.display = 'block';
        if (pass === confirmPass) {
            passwordMatchMsg.textContent = '비밀번호가 일치합니다.';
            passwordMatchMsg.style.color = '#16a34a';
        } else {
            passwordMatchMsg.textContent = '비밀번호가 일치하지 않습니다.';
            passwordMatchMsg.style.color = '#dc2626';
        }
    }

    // 3. 회원가입 폼 제출 이벤트 핸들러
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 기본 폼 제출 일단 중단 후 유효성 검사

            const name = document.getElementById('name') ? document.getElementById('name').value.trim() : '';
            const studentId = document.getElementById('studentId') ? document.getElementById('studentId').value.trim() : '';
            const department = document.getElementById('department') ? document.getElementById('department').value : '';
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

            // 유효성 검증 (Validation)
            if (!name) {
                alert('이름을 입력해주세요.');
                document.getElementById('name').focus();
                return;
            }

            if (!studentId) {
                alert('학번을 입력해주세요.');
                document.getElementById('studentId').focus();
                return;
            }

            if (!department || department === '') {
                alert('학과를 선택해주세요.');
                document.getElementById('department').focus();
                return;
            }

            if (!password) {
                alert('비밀번호를 입력해주세요.');
                passwordInput.focus();
                return;
            }

            if (password.length < 6) {
                alert('비밀번호는 최소 6자 이상이어야 합니다.');
                passwordInput.focus();
                return;
            }

            if (password !== confirmPassword) {
                alert('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
                confirmPasswordInput.focus();
                return;
            }

            // auth.js의 registerUser 함수를 호출하여 폼 필드 name 설정 후 /member 로 POST 전송
            if (typeof registerUser === 'function') {
                registerUser(registerForm);
            } else {
                // auth.js 로드 실패 시 직접 submit
                registerForm.action = '/member';
                registerForm.method = 'POST';
                registerForm.submit();
            }
        });
    }
});