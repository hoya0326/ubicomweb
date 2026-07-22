/* ==========================================
   공지사항 상세페이지 전용 투표 모듈 (notice-detail.js)
   ========================================== */

let currentNotice = null;
let currentPoll = null;
let currentUser = null;
const selectedNoticeOptions = {}; // pollId -> Set

document.addEventListener("DOMContentLoaded", function() {
    currentUser = getUser();

    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get("id");

    if (!noticeId) {
        alert("존재하지 않는 공지사항입니다.");
        window.location.href = "/notice";
        return;
    }

    loadNoticeDetail(noticeId);

    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", executeDeleteNotice);
    }
});

// ── 유틸리티 (poll.js 동일) ──────────────────────────────────────────────
function getUser() {
    try {
        const u = localStorage.getItem("currentUser");
        return u ? JSON.parse(u) : null;
    } catch { return null; }
}

function formatDeadline(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("ko-KR", {
        month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
}

function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function isEnded(poll) {
    const endsAt = poll.endsAt || poll.expiresAt;
    return !!endsAt && new Date(endsAt) < new Date();
}

function getCount(poll, optId) {
    if (!poll.votes) return 0;
    return poll.votes.filter(v => v.optionIds && v.optionIds.includes(optId)).length;
}

function getVoterCount(poll) {
    if (!poll.votes) return 0;
    return poll.votes.length;
}

function getVoters(poll, optId) {
    if (poll.isAnonymous || !poll.votes) return null;
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    return poll.votes
        .filter(v => v.optionIds && v.optionIds.includes(optId))
        .map(v => {
            const found = users.find(u => u.id === v.userId || u.username === v.userId);
            return found ? (found.name || found.username) : (v.userName || v.userId || "알 수 없음");
        });
}

function getMyVote(poll) {
    if (!currentUser || !poll.votes) return null;
    const myId = currentUser.id || currentUser.username;
    return poll.votes.slice().reverse().find(v => v.userId === myId) || null;
}

function escHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ── 데이터 수집 및 초기화 ──────────────────────────────────────────────────
function loadNoticeDetail(noticeId) {
    const notices = JSON.parse(localStorage.getItem("notices") || "[]");
    currentNotice = notices.find(n => n.id === noticeId);

    if (!currentNotice) {
        alert("해당 공지사항이 존재하지 않습니다.");
        window.location.href = "/notice";
        return;
    }

    // 작성자/관리자 삭제 권한 체크
    const isOwner = currentUser && (currentNotice.author === currentUser.name || currentNotice.author === currentUser.username);
    const canDelete = currentUser?.isAdmin || isOwner;

    if (canDelete) {
        const actionsContainer = document.getElementById("notice-actions");
        if (actionsContainer) {
            actionsContainer.innerHTML = `
                <button onclick="openDeleteModal()" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold border border-gray-200 bg-white">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    <span>공지 삭제</span>
                </button>
            `;
        }
    }

    // 조회수 반영
    currentNotice.views = (currentNotice.views || 0) + 1;
    localStorage.setItem("notices", JSON.stringify(notices));

    // 공지 내용 바인딩
    document.getElementById("notice-title").textContent = currentNotice.title;
    document.getElementById("notice-content").textContent = currentNotice.content;
    document.getElementById("notice-author").textContent = `작성자: ${currentNotice.author || "관리자"}`;
    document.getElementById("notice-date").textContent = `작성일: ${formatDate(currentNotice.createdAt)}`;
    document.getElementById("notice-views").textContent = `조회수: ${currentNotice.views}`;

    // 연결된 투표 불러오기
    loadAttachedPoll(noticeId);
}

function loadAttachedPoll(noticeId) {
    const polls = JSON.parse(localStorage.getItem("polls") || "[]");
    currentPoll = polls.find(p => p.noticeId === noticeId);

    if (!currentPoll) return;

    renderNoticePollCard();
}

// ── 렌더링 함수 (poll.js 완벽 이식) ─────────────────────────────────────────
function renderResultBar(poll) {
    const myVote = getMyVote(poll);
    const totalVoters = getVoterCount(poll);

    return poll.options.map(opt => {
        const count = getCount(poll, opt.id);
        const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
        const isMyChoice = myVote?.optionIds.includes(opt.id);
        const voters = getVoters(poll, opt.id);

        return `
          <div class="result-item">
            <div class="result-label">
              <span class="${isMyChoice ? "result-mine" : ""}">${isMyChoice ? "✓ " : ""}${escHtml(opt.text)}</span>
              <span class="result-count">${count}표 (${pct}%)</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill ${isMyChoice ? "bar-blue" : "bar-gray"}" style="width:${pct}%"></div>
            </div>
            ${voters && voters.length > 0 ? `<p class="voter-names">${escHtml(voters.join(", "))}</p>` : ""}
          </div>
        `;
    }).join("");
}

function renderVoteForm(poll) {
    if (!currentUser) {
        return `
          <p class="vote-hint">로그인 후 투표할 수 있습니다.</p>
          <div class="vote-actions mt-3">
            <button class="btn-see-result" onclick="showNoticeResult('${poll.id}')">결과 보기</button>
          </div>
        `;
    }

    const ended = isEnded(poll);
    const inputType = poll.allowMultiple ? "checkbox" : "radio";
    const myVote = getMyVote(poll);

    if (myVote && myVote.optionIds && !selectedNoticeOptions[poll.id]) {
        selectedNoticeOptions[poll.id] = new Set(myVote.optionIds);
    }

    const opts = poll.options.map(opt => {
        const checked = selectedNoticeOptions[poll.id] ? selectedNoticeOptions[poll.id].has(opt.id) : (myVote?.optionIds.includes(opt.id));
        return `
        <label class="opt-label ${checked ? "opt-selected" : ""}" id="optlabel-${poll.id}-${opt.id}">
          <input
            type="${inputType}"
            name="poll-${poll.id}"
            value="${opt.id}"
            class="opt-input"
            ${ended ? "disabled" : ""}
            ${checked ? "checked" : ""}
            onchange="onSelectNoticeOption('${poll.id}', '${opt.id}', this.checked, ${poll.allowMultiple})"
          />
          <span class="opt-text">${escHtml(opt.text)}</span>
        </label>
        `;
    }).join("");

    return `
        <div class="opts-list" id="opts-${poll.id}">${opts}</div>
        <div id="vote-error-${poll.id}" class="vote-error hidden"></div>
        <div class="vote-actions">
          ${!ended ? `<button class="btn-vote" onclick="submitNoticeVote('${poll.id}')">${myVote ? "투표 수정하기" : "투표하기"}</button>` : ""}
          <button class="btn-see-result" onclick="showNoticeResult('${poll.id}')">결과 보기</button>
        </div>
    `;
}

function renderNoticePollCard() {
    const container = document.getElementById("notice-poll-section");
    if (!container || !currentPoll) return;

    const poll = currentPoll;
    const ended = isEnded(poll);
    const myVote = getMyVote(poll);
    const hasVoted = !!myVote;

    const statusBadge = ended
        ? `<span class="badge badge-gray">마감</span>`
        : hasVoted
            ? `<span class="badge badge-green">참여 완료</span>`
            : `<span class="badge badge-blue">진행 중</span>`;

    const voterCount = getVoterCount(poll);
    const endsAt = poll.endsAt || poll.expiresAt;

    const metaItems = [
        poll.isAnonymous ? `🔒 익명` : "",
        poll.allowMultiple ? `✅ 중복 선택` : "",
        endsAt
            ? `<span class="${ended ? "text-red" : "text-orange"}">⏰ ${formatDeadline(endsAt)} ${ended ? "마감됨" : "마감"}</span>`
            : "",
        `${voterCount}명 참여`,
    ].filter(Boolean).join(" · ");

    container.innerHTML = `
        <div class="poll-card-inner" id="card-${poll.id}">
          <div class="poll-header" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px; background: #f9fafb; border-bottom: 1px solid #f3f4f6;">
            <div class="poll-header-left" style="flex: 1; min-width: 0;">
              <div class="poll-title-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <svg class="icon-bar" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="width:20px; height:20px; flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <h3 class="poll-title" style="margin: 0; word-break: break-all; font-size:16px; font-weight:700;">${escHtml(poll.title || "공지 첨부 투표")}</h3>
                ${statusBadge}
              </div>
              <p class="poll-meta" style="margin-top: 6px; margin-bottom: 0;">${metaItems}</p>
            </div>
          </div>

          <div class="poll-body" id="body-${poll.id}">
            <p class="poll-question">${escHtml(poll.question)}</p>
            <div id="content-${poll.id}">
              ${renderVoteForm(poll)}
            </div>
          </div>
        </div>
    `;
}

// ── 인터랙션 동작 (poll.js 동일) ──────────────────────────────────────────
function onSelectNoticeOption(pollId, optId, checked, allowMultiple) {
    if (!selectedNoticeOptions[pollId]) selectedNoticeOptions[pollId] = new Set();
    if (allowMultiple) {
        checked ? selectedNoticeOptions[pollId].add(optId) : selectedNoticeOptions[pollId].delete(optId);
    } else {
        selectedNoticeOptions[pollId] = new Set([optId]);
    }

    if (!currentPoll) return;
    currentPoll.options.forEach(opt => {
        const label = document.getElementById(`optlabel-${pollId}-${opt.id}`);
        if (!label) return;
        const sel = selectedNoticeOptions[pollId].has(opt.id);
        label.classList.toggle("opt-selected", sel);
    });
}

function submitNoticeVote(pollId) {
    if (!currentPoll) return;
    const errEl = document.getElementById(`vote-error-${pollId}`);
    const sel = [...(selectedNoticeOptions[pollId] || [])];

    if (!currentUser) { showVoteError(errEl, "로그인 후 투표할 수 있습니다."); return; }
    if (sel.length === 0) { showVoteError(errEl, "선택지를 선택해주세요."); return; }

    saveNoticeVote(currentPoll, sel);
    delete selectedNoticeOptions[pollId];

    loadAttachedPoll(currentNotice.id);
}

function saveNoticeVote(poll, optionIds) {
    const key = "polls";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = stored.findIndex(p => p.id === poll.id);
    if (idx === -1) return;

    if (!stored[idx].votes) stored[idx].votes = [];

    const myId = currentUser.id || currentUser.username;

    // 기존 내 투표 항목 삭제
    stored[idx].votes = stored[idx].votes.filter(v => v.userId !== myId);

    // 신규 항목 저장
    stored[idx].votes.push({
        userId: myId,
        optionIds: optionIds,
        votedAt: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(stored));
    currentPoll = stored[idx];
}

function showNoticeResult(pollId) {
    if (!currentPoll) return;
    const contentEl = document.getElementById(`content-${pollId}`);
    const ended = isEnded(currentPoll);

    if (contentEl) {
        contentEl.innerHTML = `
            <div class="result-list">${renderResultBar(currentPoll)}</div>
            <div class="vote-actions mt-3">
              ${!ended ? `<button class="btn-go-vote" onclick="showNoticeVoteForm('${pollId}')">투표하러 가기</button>` : ""}
            </div>
        `;
    }
}

function showNoticeVoteForm(pollId) {
    if (!currentPoll) return;
    const contentEl = document.getElementById(`content-${pollId}`);
    if (contentEl) {
        contentEl.innerHTML = renderVoteForm(currentPoll);
    }
}

function showVoteError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
}

// ── 삭제 관련 ────────────────────────────────────────────────────────────
function openDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.add("hidden");
}

function executeDeleteNotice() {
    if (!currentNotice) return;

    const noticeId = currentNotice.id;

    // 1. 공지사항 데이터 삭제
    let notices = JSON.parse(localStorage.getItem("notices") || "[]");
    notices = notices.filter(n => n.id !== noticeId);
    localStorage.setItem("notices", JSON.stringify(notices));

    // 2. 관련 투표 데이터 삭제
    let polls = JSON.parse(localStorage.getItem("polls") || "[]");
    polls = polls.filter(p => p.noticeId !== noticeId);
    localStorage.setItem("polls", JSON.stringify(polls));

    closeDeleteModal();
    window.location.href = "/notice";
}