/* ==========================================
   공지사항 상세페이지 전용 투표 모듈 (REST API 연동)
   ========================================== */

let currentNotice = null;
let currentPoll = null;
let currentUser = null;
const selectedNoticeOptions = {}; // pollId -> Set

document.addEventListener("DOMContentLoaded", async function() {
    currentUser = await fetchCurrentUser();

    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get("id");

    if (!noticeId) {
        alert("존재하지 않는 공지사항입니다.");
        window.location.href = "/notice";
        return;
    }

    await loadNoticeDetail(noticeId);

    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", executeDeleteNotice);
    }
});

// ── 유틸리티 및 인증 ─────────────────────────────────────────────────────────────
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null;
    }
}
function formatDeadline(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("ko-KR", {
        month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
}

function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function isEnded(poll) {
    const endsAt = poll.endsAt || poll.expiresAt;
    return !!endsAt && new Date(endsAt) <= new Date();
}

function getCount(poll, optId) {
    if (!poll.votes) return 0;
    return poll.votes.filter(v => v.optionIds && v.optionIds.map(String).includes(String(optId))).length;
}

function getVoterCount(poll) {
    if (!poll.votes) return 0;
    return poll.votes.length;
}

function getVoters(poll, optId) {
    if (poll.isAnonymous || !poll.votes) return null;
    return poll.votes
        .filter(v => v.optionIds && v.optionIds.map(String).includes(String(optId)))
        .map(v => v.userName || v.username || v.userId || "알 수 없음");
}

function getMyVote(poll) {
    if (!currentUser || !poll.votes) return null;
    const myId = String(currentUser.id || currentUser.username);
    return poll.votes.slice().reverse().find(v => String(v.userId) === myId) || null;
}

function escHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ── 데이터 수집 및 초기화 ──────────────────────────────────────────────────
async function loadNoticeDetail(noticeId) {
    try {
        const response = await fetch(`/api/notices/${noticeId}`);
        if (!response.ok) throw new Error("공지사항을 찾을 수 없습니다.");

        currentNotice = await response.json();

        // 작성자/관리자 삭제 권한 체크
        const authorName = typeof currentNotice.author === 'object' ? currentNotice.author.username : currentNotice.author;
        const currentUserName = currentUser?.username || currentUser?.name;
        const isOwner = currentUser && (authorName === currentUserName);
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

        // 공지 내용 바인딩
        document.getElementById("notice-title").textContent = currentNotice.title;
        document.getElementById("notice-content").textContent = currentNotice.content;
        document.getElementById("notice-author").textContent = `작성자: ${authorName || "관리자"}`;
        document.getElementById("notice-date").textContent = `작성일: ${formatDate(currentNotice.createdAt)}`;
        document.getElementById("notice-views").textContent = `조회수: ${currentNotice.views || 0}`;

        // 연결된 투표 불러오기
        await loadAttachedPoll(noticeId);
    } catch (error) {
        console.error("공지사항 로딩 실패:", error);
        alert("해당 공지사항이 존재하지 않거나 불러올 수 없습니다.");
        window.location.href = "/notice";
    }
}

async function loadAttachedPoll(noticeId) {
    try {
        const response = await fetch(`/api/notices/${noticeId}/poll`);
        if (response.status === 404) {
            currentPoll = null;
            return;
        }
        if (!response.ok) throw new Error("투표 정보를 가져올 수 없습니다.");

        currentPoll = await response.json();
        renderNoticePollCard();
    } catch (error) {
        console.error("투표 로딩 실패:", error);
        currentPoll = null;
    }
}

// ── 렌더링 함수 ───────────────────────────────────────────────────────────
function renderResultBar(poll) {
    const myVote = getMyVote(poll);
    const totalVoters = getVoterCount(poll);

    return poll.options.map(opt => {
        const count = getCount(poll, opt.id);
        const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
        const isMyChoice = myVote?.optionIds.map(String).includes(String(opt.id));
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
          <div class="vote-actions mt-3" style="display: flex; justify-content: flex-end;">
            <button class="btn-see-result" onclick="showNoticeResult('${poll.id}')">결과 보기</button>
          </div>
        `;
    }

    const ended = isEnded(poll);
    const inputType = poll.allowMultiple ? "checkbox" : "radio";
    const myVote = getMyVote(poll);

    if (myVote && myVote.optionIds && !selectedNoticeOptions[poll.id]) {
        selectedNoticeOptions[poll.id] = new Set(myVote.optionIds.map(String));
    }

    const opts = poll.options.map(opt => {
        const optIdStr = String(opt.id);
        const checked = selectedNoticeOptions[poll.id]
            ? selectedNoticeOptions[poll.id].has(optIdStr)
            : (myVote?.optionIds.map(String).includes(optIdStr));
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
        <div class="vote-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 12px;">
          <button class="btn-see-result" onclick="showNoticeResult('${poll.id}')">결과 보기</button>
          ${!ended ? `<button class="btn-vote" onclick="submitNoticeVote('${poll.id}')">투표하기</button>` : ""}
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

    const canClose = currentUser?.isAdmin && !ended;

    let statusBadge = "";
    if (ended) {
        statusBadge += `<span class="badge badge-gray">마감</span>`;
    } else {
        statusBadge += `<span class="badge badge-blue">진행 중</span>`;
    }

    if (hasVoted) {
        statusBadge += ` <span class="badge badge-green">참여 완료</span>`;
    }

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

    const initialContent = (hasVoted || ended)
        ? `
            <div class="result-list">${renderResultBar(poll)}</div>
            <div class="vote-actions mt-3" style="display: flex; justify-content: flex-end; align-items: center;">
              ${!ended ? `<button class="btn-see-result" style="color: #ef4444;" onclick="showNoticeVoteForm('${poll.id}')">투표 다시 하기</button>` : ""}
            </div>
          `
        : renderVoteForm(poll);

    container.innerHTML = `
        <div class="poll-card-inner" id="card-${poll.id}">
          <div class="poll-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: #f9fafb; border-bottom: 1px solid #f3f4f6;">
            <div class="poll-header-left" style="flex: 1; min-width: 0;">
              <div class="poll-title-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <svg class="icon-bar" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="width:20px; height:20px; flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <h3 class="poll-title" style="margin: 0; word-break: break-all; font-size:16px; font-weight:700;">${escHtml(poll.title || "공지 첨부 투표")}</h3>
                ${statusBadge}
              </div>
              <p class="poll-meta" style="margin-top: 6px; margin-bottom: 0;">${metaItems}</p>
            </div>

            <div class="poll-header-right" style="display: flex; align-items: center; gap: 8px;">
              ${canClose ? `<button class="btn-close-poll" type="button" onclick="closeNoticePollByAdmin('${poll.id}')" title="투표 종료" style="padding:4px 10px; font-size:12px; border:1px solid #dc2626; color:#dc2626; background:none; border-radius:4px; cursor:pointer; font-weight:600; transition: all 0.2s;">마감</button>` : ""}
            </div>
          </div>

          <div class="poll-body" id="body-${poll.id}">
            <p class="poll-question">${escHtml(poll.question)}</p>
            <div id="content-${poll.id}">
              ${initialContent}
            </div>
          </div>
        </div>
    `;
}

// ── 인터랙션 동작 ──────────────────────────────────────────────────────────
function onSelectNoticeOption(pollId, optId, checked, allowMultiple) {
    const optIdStr = String(optId);
    if (!selectedNoticeOptions[pollId]) selectedNoticeOptions[pollId] = new Set();

    if (allowMultiple) {
        checked ? selectedNoticeOptions[pollId].add(optIdStr) : selectedNoticeOptions[pollId].delete(optIdStr);
    } else {
        selectedNoticeOptions[pollId] = new Set([optIdStr]);
    }

    if (!currentPoll) return;
    currentPoll.options.forEach(opt => {
        const label = document.getElementById(`optlabel-${pollId}-${opt.id}`);
        if (!label) return;
        const sel = selectedNoticeOptions[pollId].has(String(opt.id));
        label.classList.toggle("opt-selected", sel);
    });
}

async function submitNoticeVote(pollId) {
    if (!currentPoll) return;

    if (isEnded(currentPoll)) {
        alert("이미 마감된 투표입니다.");
        await loadAttachedPoll(currentNotice.id);
        return;
    }

    const errEl = document.getElementById(`vote-error-${pollId}`);
    const sel = [...(selectedNoticeOptions[pollId] || [])];

    if (!currentUser) { showVoteError(errEl, "로그인 후 투표할 수 있습니다."); return; }
    if (sel.length === 0) { showVoteError(errEl, "선택지를 선택해주세요."); return; }

    try {
        const response = await fetch(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                optionIds: sel
            })
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            showVoteError(errEl, errorMsg || "투표 저장에 실패했습니다.");
            return;
        }

        delete selectedNoticeOptions[pollId];

        // 투표 상태 동기화 및 렌더링
        await loadAttachedPoll(currentNotice.id);
        showNoticeResult(pollId);
    } catch (error) {
        console.error("투표 제출 오류:", error);
        showVoteError(errEl, "투표 처리 중 오류가 발생했습니다.");
    }
}

function showNoticeResult(pollId) {
    if (!currentPoll) return;
    const contentEl = document.getElementById(`content-${pollId}`);
    const ended = isEnded(currentPoll);

    if (contentEl) {
        contentEl.innerHTML = `
            <div class="result-list">${renderResultBar(currentPoll)}</div>
            <div class="vote-actions mt-3" style="display: flex; justify-content: flex-end; align-items: center;">
              ${!ended ? `<button class="btn-see-result" style="color: #ef4444;" onclick="showNoticeVoteForm('${pollId}')">투표 다시 하기</button>` : ""}
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

// ── 관리자 투표 마감 처리 ─────────────────────────────────────────────────
async function closeNoticePollByAdmin(pollId) {
    if (!currentUser || !currentUser.isAdmin) {
        alert("관리자 권한이 필요합니다.");
        return;
    }

    if (!confirm("이 투표를 마감 처리하시겠습니까?")) return;

    try {
        const response = await fetch(`/api/polls/${pollId}/close`, {
            method: 'PATCH'
        });

        if (!response.ok) throw new Error("마감 처리에 실패했습니다.");

        await loadAttachedPoll(currentNotice.id);
    } catch (error) {
        console.error("투표 마감 처리 오류:", error);
        alert("투표 마감 중 오류가 발생했습니다.");
    }
}

// ── 공지사항 삭제 처리 ────────────────────────────────────────────────────────────
function openDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.add("hidden");
}

async function executeDeleteNotice() {
    if (!currentNotice) return;

    try {
        const response = await fetch(`/api/notices/${currentNotice.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error("삭제 권한이 없거나 삭제에 실패했습니다.");

        closeDeleteModal();
        window.location.href = "/notice";
    } catch (error) {
        console.error("공지 삭제 오류:", error);
        alert("공지사항 삭제 중 오류가 발생했습니다.");
    }
}