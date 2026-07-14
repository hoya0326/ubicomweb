"use strict";

/* ── 데이터 로드 및 persistence (API 연동) ─────────────────────────── */
let members = [];
let currentUser = null;

async function loadData() {
    // 1. 로그인 사용자 확인
    const u = localStorage.getItem("currentUser");
    currentUser = u ? JSON.parse(u) : null;
    if (currentUser) {
        const navUserEl = document.getElementById("navUsername");
        const logoutBtnEl = document.getElementById("logoutBtn");
        if (navUserEl) navUserEl.textContent = currentUser.name || currentUser.username;
        if (logoutBtnEl) logoutBtnEl.style.display = "block";

        // 관리자가 아니라면 경고 후 튕겨내기
        if (!currentUser.isAdmin) {
            alert("관리자만 접근할 수 있습니다.");
            location.href = "/";
            return;
        }
    }

    // 2. 백엔드 데이터베이스 연동 (실패 시 로컬스토리지 백업으로 대체)
    try {
        const response = await fetch('/api/admin/members');
        if (!response.ok) throw new Error("서버에서 회원 목록을 불러오지 못했습니다.");

        members = await response.json();
    } catch (error) {
        console.error(error);
        const raw = localStorage.getItem("users");
        if (raw) {
            members = JSON.parse(raw);
        } else {
            // 초기 백업 데이터 (Seed)
            members = [
                { id: "u1", name: "관리자", studentId: "00000000", department: "컴퓨터공학과", isAdmin: true, joinedAt: "2024-03-01", isWebUser: true },
                { id: "u2", name: "김민준", studentId: "20210001", department: "소프트웨어학과", isAdmin: false, joinedAt: "2024-03-05", isWebUser: true },
                { id: "u3", name: "이서윤", studentId: "20210002", department: "컴퓨터공학과", isAdmin: false, joinedAt: "2024-03-07", isWebUser: false },
                { id: "u4", name: "박지훈", studentId: "20220001", department: "정보통신학과", isAdmin: false, joinedAt: "2024-09-01", isWebUser: true },
                { id: "u5", name: "최유나", studentId: "20230001", department: "소프트웨어학과", isAdmin: false, joinedAt: "2025-03-02", isWebUser: false },
            ];
            saveMembers();
        }
    }

    renderStats();
    renderMembers();
}

function saveMembers() {
    localStorage.setItem("users", JSON.stringify(members));
}

function logout() {
    localStorage.removeItem("currentUser");
    location.reload();
}

/* ── stats (통계 현황 계산) ────────────────────────────────────────── */
function renderStats() {
    const total = members.length;
    const admins = members.filter((m) => m.isAdmin).length;
    const regular = total - admins;
    const now = new Date();
    const thisMonth = members.filter((m) => {
        if (!m.joinedAt) return false;
        const d = new Date(m.joinedAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statAdmin").textContent = admins;
    document.getElementById("statRegular").textContent = regular;
    document.getElementById("statNew").textContent = thisMonth;
}

/* ── render list (동아리원 목록 랜더링) ─────────────────────────────── */
function renderMembers(filter) {
    const q = (filter || document.getElementById("searchInput").value || "").toLowerCase();
    const filtered = members.filter(
        (m) =>
            m.name.toLowerCase().includes(q) ||
            m.studentId.includes(q) ||
            (m.department || "").toLowerCase().includes(q)
    );

    const tbody = document.getElementById("membersList");
    const empty = document.getElementById("emptyState");

    if (filtered.length === 0) {
        tbody.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }
    empty.classList.add("hidden");

    tbody.innerHTML = filtered
        .map((m) => {
            const webStatusBadge = m.isWebUser
                ? `<span class="badge-admin" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; margin-left: 6px;">웹 가입</span>`
                : "";

            let genderText = "-";
            if (m.gender === "M" || m.gender === "m") genderText = "남자";
            if (m.gender === "F" || m.gender === "f") genderText = "여자";

            return `
    <div class="member-row" id="row_${m.id}" data-search="${escHtml(m.name + " " + m.studentId + " " + (m.department || ""))}">
      <div class="row-summary" onclick="toggleRow(this)">
        <div class="col-avatar"><div class="avatar">${escHtml(m.name.charAt(0))}</div></div>
        <div class="col-name">
          <span class="member-name">${escHtml(m.name)}</span>
          ${m.isAdmin ? '<span class="badge-admin">관리자</span>' : ""}
          ${webStatusBadge}
        </div>
        <div class="col-sid">${escHtml(m.studentId)}</div>
        <div class="col-dept">${escHtml(m.department || "-")}</div>
        <div class="col-joined">${escHtml(m.joinedAt ? m.joinedAt.slice(0, 10) : "-")}</div>
        <div class="col-action">
          <svg class="chevron" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
      <div class="row-detail hidden">
        <div class="detail-inner">
          <div class="detail-grid" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
            <div class="detail-cell"><label>이름</label><p>${escHtml(m.name)}</p></div>
            <div class="detail-cell"><label>성별</label><p>${escHtml(genderText)}</p></div>
            <div class="detail-cell"><label>학번</label><p>${escHtml(m.studentId)}</p></div>
            <div class="detail-cell"><label>학과</label><p>${escHtml(m.department || "-")}</p></div>
            <div class="detail-cell"><label>전화번호</label><p>${escHtml(m.phone || "-")}</p></div>
            <div class="detail-cell"><label>가입일</label><p>${escHtml(m.joinedAt ? m.joinedAt.slice(0, 10) : "-")}</p></div>
            <div class="detail-cell"><label>역할</label><p>${m.isAdmin ? "관리자" : "일반 부원"}</p></div>
          </div>
          <div class="detail-actions">
            <div id="${m.id}-btn">
              <button class="btn-del-init" onclick="showConfirm('${m.id}')">삭제</button>
            </div>
            <div id="${m.id}-confirm" class="hidden confirm-row">
              <span class="confirm-text">정말 삭제하시겠습니까?</span>
              <button class="btn-del-ok" onclick="deleteMember('${m.id}')">삭제</button>
              <button class="btn-del-cancel" onclick="hideConfirm('${m.id}')">취소</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
        }).join("");
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* ── row toggle (상세 아코디언 열고 닫기) ──────────────────────────────── */
function toggleRow(summary) {
    const detail = summary.nextElementSibling;
    const chevron = summary.querySelector(".chevron");
    const open = !detail.classList.contains("hidden");
    detail.classList.toggle("hidden");
    chevron.style.transform = open ? "" : "rotate(180deg)";
    summary.style.background = open ? "" : "#f9fafb";
}

/* ── delete (삭제 처리) ────────────────────────────────────────────────── */
function showConfirm(id) {
    document.getElementById(id + "-btn").classList.add("hidden");
    document.getElementById(id + "-confirm").classList.remove("hidden");
}
function hideConfirm(id) {
    document.getElementById(id + "-btn").classList.remove("hidden");
    document.getElementById(id + "-confirm").classList.add("hidden");
}
async function deleteMember(id) {
    const row = document.getElementById("row_" + id);
    if (!row) return;

    try {
        const response = await fetch(`/api/admin/members/delete/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error("서버 응답 오류");
        const result = await response.json();

        if (result.success) {
            row.style.transition = "opacity .3s";
            row.style.opacity = "0";

            setTimeout(() => {
                members = members.filter((m) => m.id !== id);
                saveMembers();
                renderStats();
                renderMembers();
            }, 300);
        } else {
            alert(result.message || "삭제 처리에 실패했습니다.");
        }
    } catch (e) {
        console.error(e);
        alert("서버와 통신할 수 없거나 삭제 권한이 없습니다. 다시 시도해 주세요.");
    }
}

/* ── search (실시간 검색 필터링) ────────────────────────────────────────── */
function filterMembers(q) {
    renderMembers(q);
}

/* ── modal open/close (모달 제어) ────────────────────────────────────────── */
function openModal() {
    document.getElementById("addModal").classList.remove("hidden");
    document.getElementById("addForm").classList.remove("hidden");
    document.getElementById("addSuccess").classList.add("hidden");

    // 일반 입력 필드 초기화
    ["addName", "addStudentId", "addDept", "addPw"].forEach(
        (id) => { if(document.getElementById(id)) document.getElementById(id).value = ""; }
    );

    // 💡 개별 컴포넌트로 변경된 연락처 필드 및 에러 아웃라인 초기화
    PhoneInput.clear("addPhoneWrap");
    PhoneInput.setError("addPhoneWrap", false);

    document.querySelector('input[name="addGender"][value="m"]').checked = true;
    document.getElementById("addError").classList.add("hidden");
}

function closeModal() {
    document.getElementById("addModal").classList.add("hidden");
}

/* ── addMember (멤버 등록 비즈니스 로직) ─────────────────────────────────── */
async function addMember() {
    const name = document.getElementById("addName").value.trim();
    const sid = document.getElementById("addStudentId").value.trim();
    const dept = document.getElementById("addDept").value.trim();
    const pw = document.getElementById("addPw").value;
    const gender = document.querySelector('input[name="addGender"]:checked').value;

    // 💡 UI 유틸리티를 활용해 'XXX-XXXX-XXXX' 형태의 값 취득
    const phone = PhoneInput.getValue("addPhoneWrap");

    // 초기 상태에서 에러 시각 효과 제거
    PhoneInput.setError("addPhoneWrap", false);

    // 유효성 체크
    if (!name || !sid || !dept || !pw || PhoneInput.isEmpty("addPhoneWrap")) {
        showError("필수 항목(*)을 모두 입력해주세요.");
        if (PhoneInput.isEmpty("addPhoneWrap")) {
            PhoneInput.setError("addPhoneWrap", true);
        }
        return;
    }

    // 세 칸 중 하나라도 미완성인 상태 체크 (예: 010-123-빈칸)
    if (phone.split('-').some(val => !val || val.trim() === "")) {
        showError("전화번호 3자리를 모두 완벽하게 입력해주세요.");
        PhoneInput.setError("addPhoneWrap", true);
        return;
    }

    if (!/^\d{8}$/.test(sid)) { showError("학번은 8자리 숫자로 입력해주세요."); return; }
    if (members.some((m) => m.studentId === sid)) { showError("이미 존재하는 학번입니다."); return; }
    if (pw.length < 6) { showError("비밀번호는 최소 6자 이상이어야 합니다."); return; }

    const newMember = {
        name: name,
        studentId: sid,
        department: dept,
        password: pw,
        gender: gender,
        phone: phone
    };

    try {
        const response = await fetch('/api/admin/members/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMember)
        });
        const result = await response.json();
        if(!result.success) { showError(result.message || "추가 실패"); return; }

        await loadData();

        document.getElementById("addForm").classList.add("hidden");
        document.getElementById("addSuccess").classList.remove("hidden");
        setTimeout(closeModal, 1200);
    } catch(e) {
        showError("서버 전송 중 오류가 발생했습니다.");
    }
}

function showError(msg) {
    const el = document.getElementById("addError");
    el.textContent = msg;
    el.classList.remove("hidden");
}

/* ── PhoneInput (연락처 세 칸 입력 UI 유틸리티) ────────────────────────── */
const PhoneInput = (() => {
    const MAX = [3, 4, 4]; // 각 Input 박스의 자릿수 규칙

    function getInputs(wrapId) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return [];
        return Array.from(wrap.querySelectorAll("input[data-phone]"));
    }

    function onInput(inputs, idx, e) {
        const raw = e.target.value.replace(/\D/g, "");
        e.target.value = raw.slice(0, MAX[idx]);

        // 입력 자릿수가 꽉 차면 자동으로 다음 칸으로 포커스 전환
        if (e.target.value.length === MAX[idx] && idx < inputs.length - 1) {
            inputs[idx + 1].focus();
        }
    }

    function onKeydown(inputs, idx, e) {
        // Backspace를 눌렀을 때 칸이 비어있다면 이전 칸으로 포커스 백업
        if (e.key === "Backspace" && e.target.value === "" && idx > 0) {
            inputs[idx - 1].focus();
        }
        const allowed = [
            "Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End",
        ];
        if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
            e.preventDefault();
        }
    }

    function onPaste(inputs, idx, e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData)
            .getData("text")
            .replace(/\D/g, "");
        if (!text) return;

        // 클립보드 복사-붙여넣기 시 알아서 세 칸으로 쪼개서 분배
        let pos = 0;
        for (let i = 0; i < inputs.length && pos < text.length; i++) {
            const chunk = text.slice(pos, pos + MAX[i]);
            inputs[i].value = chunk;
            pos += chunk.length;
        }
        const lastFilled = inputs.reduce((acc, inp, i) =>
            inp.value.length > 0 ? i : acc, 0);
        const next = Math.min(lastFilled + 1, inputs.length - 1);
        inputs[next].focus();
    }

    return {
        init(wrapId) {
            const inputs = getInputs(wrapId);
            if (!inputs.length) return;
            inputs.forEach((inp, idx) => {
                inp.inputMode = "numeric";
                inp.addEventListener("input",   (e) => onInput(inputs, idx, e));
                inp.addEventListener("keydown", (e) => onKeydown(inputs, idx, e));
                inp.addEventListener("paste",   (e) => onPaste(inputs, idx, e));
            });
        },
        getValue(wrapId) {
            return getInputs(wrapId).map((i) => i.value.trim()).join("-");
        },
        clear(wrapId) {
            getInputs(wrapId).forEach((i) => (i.value = ""));
        },
        setError(wrapId, on) {
            const wrap = document.getElementById(wrapId);
            if (!wrap) return;
            wrap.querySelectorAll("input[data-phone]").forEach((inp) => {
                inp.style.borderColor = on ? "#ef4444" : "";
                inp.style.boxShadow   = on ? "0 0 0 3px #fee2e2" : "";
            });
        },
        isEmpty(wrapId) {
            return getInputs(wrapId).every((i) => i.value.trim() === "");
        },
    };
})();

/* ── init (초기 구동 리스너) ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
    loadData();

    // 💡 새롭게 구성된 3칸 입력기 컴포넌트 이벤트 연결
    PhoneInput.init("addPhoneWrap");

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    document.getElementById("addModal").addEventListener("click", function (e) {
        if (e.target === this) closeModal();
    });
});