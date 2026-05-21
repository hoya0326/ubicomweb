// Register page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already logged in
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    const registerForm = document.getElementById('register-form');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError('error-message');
        
        const name = document.getElementById('name').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const department = document.getElementById('department').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!name || !studentId || !department || !password || !confirmPassword) {
            showError('error-message', '모든 필드를 입력해주세요.');
            return;
        }
        
        if (studentId.length !== 8) {
            showError('error-message', '학번은 8자리여야 합니다.');
            return;
        }
        
        if (!/^\d{8}$/.test(studentId)) {
            showError('error-message', '학번은 숫자만 입력 가능합니다.');
            return;
        }
        
        if (password.length < 4) {
            showError('error-message', '비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('error-message', '비밀번호가 일치하지 않습니다.');
            return;
        }
        
        // Attempt registration
        const result = registerUser({
            name: name,
            studentId: studentId,
            department: department,
            password: password
        });
        
        if (result.success) {
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            window.location.href = 'login.html';
        } else {
            showError('error-message', result.error);
        }
    });
});
