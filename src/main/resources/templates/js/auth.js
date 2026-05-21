// Authentication utilities

// Initialize default admin account
function initializeAdmin() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some(u => u.studentId === '20233244');
    
    if (!adminExists) {
        const adminUser = {
            id: 'admin-' + Date.now().toString(),
            name: '관리자',
            studentId: '20233244',
            department: '정보보안학과',
            password: 'admin',
            isAdmin: true,
            createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('currentUser');
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Check if current user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

// Login user
function loginUser(studentId, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.studentId === studentId && u.password === password);
    
    if (user) {
        const currentUser = {
            id: user.id,
            username: user.name,
            studentId: user.studentId,
            department: user.department,
            isAdmin: user.isAdmin || false
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return { success: true, user: currentUser };
    }
    
    return { success: false, error: '학번 또는 비밀번호가 일치하지 않습니다.' };
}

// Register user
function registerUser(userData) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if student ID already exists
    if (users.some(u => u.studentId === userData.studentId)) {
        return { success: false, error: '이미 등록된 학번입니다.' };
    }
    
    const newUser = {
        id: 'user-' + Date.now().toString(),
        name: userData.name,
        studentId: userData.studentId,
        department: userData.department,
        password: userData.password,
        isAdmin: false,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true };
}

// Logout user
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Require login for protected pages
function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Require admin for admin-only features
function requireAdmin() {
    if (!isAdmin()) {
        alert('관리자만 접근할 수 있습니다.');
        return false;
    }
    return true;
}

// Initialize admin on page load
initializeAdmin();
