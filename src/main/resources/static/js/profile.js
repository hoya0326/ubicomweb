// 전화번호 자동 포커스 이동 & 백스페이스 이전 칸 이동 함수
function setupPhoneFocus() {
    const p1 = document.getElementById("phone1");
    const p2 = document.getElementById("phone2");
    const p3 = document.getElementById("phone3");

    const inputs = [p1, p2, p3];

    inputs.forEach((input, index) => {
        // 1. 숫자만 입력 가능하도록 제한 & 글자 수 채워지면 다음 칸 이동
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, ""); // 숫자 이외 문자 제거

            // 최대 글자 수를 채우면 다음 칸으로 포커스 이동
            if (this.value.length >= this.maxLength && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        // 2. 백스페이스 눌렀을 때 현재 칸이 비어있으면 이전 칸으로 포커스 이동
        input.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && this.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    setupPhoneFocus();

    try {
        const response = await fetch(
            "/api/user?t=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("회원정보 조회 실패");
        }

        const user = await response.json();

        if (!user.isLoggedIn) {
            alert("로그인이 필요합니다.");
            location.href = "/login";
            return;
        }

        const username = user.username || "";
        const studentId = user.studentId || "";
        const department = user.department || "";
        const phone = user.phone || "";

        document.getElementById("profile-avatar").textContent = username.charAt(0);
        document.getElementById("profile-name").textContent = username;
        document.getElementById("profile-student-id").textContent = studentId;
        document.getElementById("profile-department").textContent = department;

        document.getElementById("student-id").value = studentId;
        document.getElementById("name").value = username;
        document.getElementById("department").value = department;

        // 전화번호 데이터 파싱 후 입력창에 각각 채우기
        if (phone) {
            const parts = phone.split("-");
            if (parts.length === 3) {
                document.getElementById("phone1").value = parts[0];
                document.getElementById("phone2").value = parts[1];
                document.getElementById("phone3").value = parts[2];
            } else {
                // "-" 없이 통으로 들어온 경우 예외 처리
                const cleanPhone = phone.replace(/[^0-9]/g, '');
                if (cleanPhone.length === 11) {
                    document.getElementById("phone1").value = cleanPhone.substring(0, 3);
                    document.getElementById("phone2").value = cleanPhone.substring(3, 7);
                    document.getElementById("phone3").value = cleanPhone.substring(7, 11);
                }
            }
        }

        if (user.isAdmin) {
            document.getElementById("admin-badge").style.display = "inline-block";
        }

    } catch (error) {
        console.error(error);
        alert("회원정보를 불러오지 못했습니다.");
    }
});

function showStatus(elementId, message, success) {
    const alertBox = document.getElementById(elementId);

    alertBox.textContent = message;
    alertBox.className = success ? "alert alert-success" : "alert alert-error";
    alertBox.style.display = "flex";
}

const newPasswordInput = document.getElementById("new-password");
const strengthBar = document.getElementById("password-strength-bar");
const strengthText = document.getElementById("password-strength-text");

newPasswordInput.addEventListener("input", function () {
    const value = newPasswordInput.value;

    let score = 0;

    if (value.length >= 6) score++;
    if (/[A-Za-z]/.test(value) && /\d/.test(value)) score++;
    if (value.length >= 8 && /[^A-Za-z0-9]/.test(value)) score++;

    if (value.length === 0) {
        strengthBar.style.width = "0%";
        strengthBar.style.background = "transparent";
        strengthText.textContent = "비밀번호 보안 수준";
        strengthText.style.color = "#9ca3af";
    } else if (score <= 1) {
        strengthBar.style.width = "33%";
        strengthBar.style.background = "#ef4444";
        strengthText.textContent = "약함";
        strengthText.style.color = "#dc2626";
    } else if (score === 2) {
        strengthBar.style.width = "66%";
        strengthBar.style.background = "#eab308";
        strengthText.textContent = "보통";
        strengthText.style.color = "#ca8a04";
    } else {
        strengthBar.style.width = "100%";
        strengthBar.style.background = "#22c55e";
        strengthText.textContent = "강함";
        strengthText.style.color = "#16a34a";
    }
});

document.getElementById("profile-save-btn")
    .addEventListener("click", async function () {

        const name = document.getElementById("name").value.trim();
        const department = document.getElementById("department").value.trim();

        const p1 = document.getElementById("phone1").value.trim();
        const p2 = document.getElementById("phone2").value.trim();
        const p3 = document.getElementById("phone3").value.trim();

        if (!name) {
            showStatus("profile-alert", "이름을 입력해주세요.", false);
            return;
        }

        if (!department) {
            showStatus("profile-alert", "학과를 입력해주세요.", false);
            return;
        }

        if (!p1 || !p2 || !p3) {
            showStatus("profile-alert", "전화번호를 올바르게 입력해주세요.", false);
            return;
        }

        // 분할된 전화번호 결합
        const fullPhone = `${p1}-${p2}-${p3}`;

        try {
            const response = await fetch(
                "/api/user/profile",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({
                        name: name,
                        department: department,
                        phone: fullPhone
                    })
                }
            );

            const result = await response.json();

            showStatus("profile-alert", result.message, result.success);

            if (result.success) {
                document.getElementById("profile-name").textContent = name;
                document.getElementById("profile-avatar").textContent = name.charAt(0);
                document.getElementById("profile-department").textContent = department;

                const savedUser = JSON.parse(localStorage.getItem("currentUser") || "null");

                if (savedUser) {
                    savedUser.username = name;
                    savedUser.department = department;
                    savedUser.phone = fullPhone;
                    localStorage.setItem("currentUser", JSON.stringify(savedUser));
                }
            }

        } catch (error) {
            console.error(error);
            showStatus("profile-alert", "정보를 저장하는 중 오류가 발생했습니다.", false);
        }
    });

document.getElementById("password-change-btn")
    .addEventListener("click", async function () {

        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showStatus("password-alert", "비밀번호 항목을 모두 입력해주세요.", false);
            return;
        }

        if (newPassword.length < 6) {
            showStatus("password-alert", "새 비밀번호는 6자 이상이어야 합니다.", false);
            return;
        }

        if (newPassword !== confirmPassword) {
            showStatus("password-alert", "새 비밀번호가 서로 일치하지 않습니다.", false);
            return;
        }

        try {
            const response = await fetch(
                "/api/user/password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    })
                }
            );

            const result = await response.json();
            showStatus("password-alert", result.message, result.success);

            if (result.success) {
                document.getElementById("current-password").value = "";
                document.getElementById("new-password").value = "";
                document.getElementById("confirm-password").value = "";

                strengthBar.style.width = "0%";
                strengthBar.style.background = "transparent";
                strengthText.textContent = "비밀번호 보안 수준";
                strengthText.style.color = "#9ca3af";
            }

        } catch (error) {
            console.error(error);
            showStatus("password-alert", "비밀번호를 변경하는 중 오류가 발생했습니다.", false);
        }
    });