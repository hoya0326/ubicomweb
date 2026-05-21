// Login page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already logged in
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError('error-message');
        
        const studentId = document.getElementById('studentId').value.trim();
        const password = document.getElementById('password').value;
        
        // Validation
        if (!studentId || !password) {
            showError('error-message', '학번과 비밀번호를 모두 입력해주세요.');
            return;
        }
        
        if (studentId.length !== 8) {
            showError('error-message', '학번은 8자리여야 합니다.');
            return;
        }
        
        // Attempt login
        const result = loginUser(studentId, password);
        
        if (result.success) {
            // Redirect to home page
            window.location.href = 'index.html';
        } else {
            showError('error-message', result.error);
        }
    });
});
