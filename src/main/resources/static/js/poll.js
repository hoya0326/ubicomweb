/* ==========================================
   UbiCOM 동아리 투표 시스템 (poll.js)
   ========================================== */

// ── 상태 ──────────────────────────────────────────────────────────────────
let polls = [];
let currentFilter = "all";
let currentUser = null;
const selectedOptions = {}; // pollId → Set
const expandedState = {}; // pollId → boolean (기본값: false / 접힘)

// ── 유틸 ──────────────────────────────────────────────────────────────────
function getUser() {
    try {
        const u = localStorage.getItem("currentUser");
        return u ? JSON.parse(u) : null;
    } catch { return null; }
}

function formatDeadline(iso) {
    return new Date(iso).toLocaleString("ko-KR", {
        month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function isEnded(poll) {
    return !!poll.endsAt && new Date(poll.endsAt) < new Date();
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
        .map(v => users.find(u => u.id === v.userId)?.name || v.userId || "알 수 없음");
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

// ── 데이터 로드 & 저장 ────────────────────────────────────────────────────
function loadPolls() {
    const standalone = JSON.parse(localStorage.getItem("standalonePolls") || "[]")
        .map(p => ({...p, _storageKey: "standalonePolls", votes: p.votes || []}));

    const notices = JSON.parse(localStorage.getItem("notices") || "[]");
    const attached = JSON.parse(localStorage.getItem("polls") || "[]")
        .map(p => {
            const notice = notices.find(n => n.id === p.noticeId);
            return {
                ...p,
                title: p.title || `[공지] ${notice?.title || "공지사항"} 투표`,
                createdBy: p.createdBy || notice?.author || "관리자",
                _storageKey: "polls",
                noticeTitle: notice?.title,
                votes: p.votes || []
            };
        });

    polls = [...standalone, ...attached];
}

function saveVote(poll, optionIds) {
    const key = poll._storageKey || "standalonePolls";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = stored.findIndex(p => p.id === poll.id);
    if (idx === -1) return;

    if (!stored[idx].votes) stored[idx].votes = [];

    const myId = currentUser.id || currentUser.username;

    // 기존 내 투표 기록 제거
    stored[idx].votes = stored[idx].votes.filter(v => v.userId !== myId);

    // 신규 투표 기록 추가
    stored[idx].votes.push({
        userId: myId,
        optionIds: optionIds,
        votedAt: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(stored));
    poll.votes = stored[idx].votes;
}

function deletePollFromStorage(poll) {
    const key = poll._storageKey || "standalonePolls";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(stored.filter(p => p.id !== poll.id)));
}

// ── 렌더링 ────────────────────────────────────────────────────────────────
function getFiltered() {
    const now = new Date();
    return polls.filter(p => {
        if (currentFilter === "active") return !p.endsAt || new Date(p.endsAt) >= now;
        if (currentFilter === "ended") return !!p.endsAt && new Date(p.endsAt) < now;
        return true;
    });
}

function renderFilterTabs() {
    const now = new Date();
    const activeCount = polls.filter(p => !p.endsAt || new Date(p.endsAt) >= now).length;
    const endedCount = polls.filter(p => !!p.endsAt && new Date(p.endsAt) < now).length;

    const tabs = [
        {key: "all", label: `전체 (${polls.length})`},
        {key: "active", label: `진행 중 (${activeCount})`},
        {key: "ended", label: `마감 (${endedCount})`},
    ];

    return tabs.map(t => `
        <button
          class="tab-btn ${currentFilter === t.key ? "tab-active" : "tab-inactive"}"
          onclick="setFilter('${t.key}')"
        >${escHtml(t.label)}</button>
    `).join("");
}

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
            <button class="btn-see-result" onclick="showResult('${poll.id}')">결과 보기</button>
          </div>
        `;
    }

    const ended = isEnded(poll);
    const inputType = poll.allowMultiple ? "checkbox" : "radio";
    const myVote = getMyVote(poll);

    if (myVote && myVote.optionIds && !selectedOptions[poll.id]) {
        selectedOptions[poll.id] = new Set(myVote.optionIds);
    }

    const opts = poll.options.map(opt => {
        const checked = selectedOptions[poll.id] ? selectedOptions[poll.id].has(opt.id) : (myVote?.optionIds.includes(opt.id));
        return `
        <label class="opt-label ${checked ? "opt-selected" : ""}" id="optlabel-${poll.id}-${opt.id}">
          <input
            type="${inputType}"
            name="poll-${poll.id}"
            value="${opt.id}"
            class="opt-input"
            ${ended ? "disabled" : ""}
            ${checked ? "checked" : ""}
            onchange="onSelectOption('${poll.id}', '${opt.id}', this.checked, ${poll.allowMultiple})"
          />
          <span class="opt-text">${escHtml(opt.text)}</span>
        </label>
        `;
    }).join("");

    return `
        <div class="opts-list" id="opts-${poll.id}">${opts}</div>
        <div id="vote-error-${poll.id}" class="vote-error hidden"></div>
        <div class="vote-actions">
          ${!ended ? `<button class="btn-vote" onclick="submitVote('${poll.id}')">${myVote ? "투표 수정하기" : "투표하기"}</button>` : ""}
          <button class="btn-see-result" onclick="showResult('${poll.id}')">결과 보기</button>
        </div>
    `;
}

function renderPollCard(poll) {
    const ended = isEnded(poll);
    const myVote = getMyVote(poll);
    const hasVoted = !!myVote;

    const isOwner = currentUser && (poll.createdBy === currentUser.name || poll.createdBy === currentUser.username);
    const canDelete = currentUser?.isAdmin || isOwner;

    const statusBadge = ended
        ? `<span class="badge badge-gray">마감</span>`
        : hasVoted
            ? `<span class="badge badge-green">참여 완료</span>`
            : `<span class="badge badge-blue">진행 중</span>`;

    const voterCount = getVoterCount(poll);

    const metaItems = [
        `${escHtml(poll.createdBy)} · ${formatDate(poll.createdAt)}`,
        poll.noticeTitle ? `📌 공지: ${escHtml(poll.noticeTitle)}` : "",
        poll.isAnonymous ? `🔒 익명` : "",
        poll.allowMultiple ? `✅ 중복 선택` : "",
        poll.endsAt
            ? `<span class="${ended ? "text-red" : "text-orange"}">⏰ ${formatDeadline(poll.endsAt)} ${ended ? "마감됨" : "마감"}</span>`
            : "",
        `${voterCount}명 참여`,
    ].filter(Boolean).join(" · ");

    const isExpanded = expandedState[poll.id] === true;

    return `
        <div class="poll-card ${ended ? "poll-ended" : ""}" id="card-${poll.id}">
          <!-- 헤더: 투표 제목 및 우측에 쓰레기통 + 화살표 아이콘 배치 -->
          <div class="poll-header" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 16px; cursor: pointer;" onclick="toggleExpand('${poll.id}')">
            <div class="poll-header-left" style="flex: 1; min-width: 0;">
              <div class="poll-title-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <svg class="icon-bar" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="width:20px; height:20px; flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <h3 class="poll-title" style="margin: 0; word-break: break-all;">${escHtml(poll.title)}</h3>
                ${statusBadge}
              </div>
              <p class="poll-meta" style="margin-top: 6px; margin-bottom: 0;">${metaItems}</p>
            </div>

            <!-- 제목 우측: 삭제(쓰레기통) 및 펼침(화살표) 버튼 -->
            <div class="poll-header-actions" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: 12px;" onclick="event.stopPropagation();">
              ${canDelete
        ? `<button class="btn-trash" type="button" onclick="confirmDelete('${poll.id}')" title="삭제">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                   </button>`
        : ""}
              <button type="button" onclick="toggleExpand('${poll.id}')" style="background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center;">
                <svg class="chevron ${isExpanded ? "chevron-open" : ""}" id="chevron-${poll.id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>
          </div>

          <div class="delete-confirm hidden" id="del-confirm-${poll.id}">
            <span class="del-confirm-text">정말 삭제할까요?</span>
            <button class="btn-del-ok" type="button" onclick="execDelete('${poll.id}')">삭제</button>
            <button class="btn-del-cancel" type="button" onclick="cancelDelete('${poll.id}')">취소</button>
          </div>

          <!-- 본문 영역 -->
          <div class="poll-body ${isExpanded ? "" : "hidden"}" id="body-${poll.id}">
            <p class="poll-question">${escHtml(poll.question)}</p>
            <div id="content-${poll.id}">
              ${renderVoteForm(poll)}
            </div>
          </div>
        </div>
    `;
}

function renderPollList() {
    const container = document.getElementById("pollList");
    if (!container) return;

    const filtered = getFiltered();
    if (filtered.length === 0) {
        const msg = currentFilter === "active" ? "진행 중인 투표가 없습니다."
            : currentFilter === "ended" ? "마감된 투표가 없습니다."
                : "아직 투표가 없습니다.";
        container.innerHTML = `<div class="empty-state">${msg}</div>`;
        return;
    }
    container.innerHTML = filtered.map(renderPollCard).join("");
}

function renderAll() {
    const filterTabsEl = document.getElementById("filterTabs");
    if (filterTabsEl) {
        filterTabsEl.innerHTML = renderFilterTabs();
    }

    const btnArea = document.getElementById("createBtnArea");
    if (btnArea) {
        if (currentUser) {
            btnArea.innerHTML = `<button class="btn-new-poll" onclick="openCreateForm()">+ 새 투표 만들기</button>`;
        } else {
            btnArea.innerHTML = `<span class="text-xs text-gray-500">※ 로그인 후 투표 가능</span>`;
        }
    }
    renderPollList();
}

// ── 인터랙션 ──────────────────────────────────────────────────────────────
function setFilter(key) {
    currentFilter = key;
    renderAll();
}

function toggleExpand(pollId) {
    expandedState[pollId] = !expandedState[pollId];
    const body = document.getElementById(`body-${pollId}`);
    const chevron = document.getElementById(`chevron-${pollId}`);
    if (!body) return;

    const isExpanded = expandedState[pollId];
    body.classList.toggle("hidden", !isExpanded);
    if (chevron) {
        chevron.classList.toggle("chevron-open", isExpanded);
    }
}

function onSelectOption(pollId, optId, checked, allowMultiple) {
    if (!selectedOptions[pollId]) selectedOptions[pollId] = new Set();
    if (allowMultiple) {
        checked ? selectedOptions[pollId].add(optId) : selectedOptions[pollId].delete(optId);
    } else {
        selectedOptions[pollId] = new Set([optId]);
    }

    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    poll.options.forEach(opt => {
        const label = document.getElementById(`optlabel-${pollId}-${opt.id}`);
        if (!label) return;
        const sel = selectedOptions[pollId].has(opt.id);
        label.classList.toggle("opt-selected", sel);
    });
}

function submitVote(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const errEl = document.getElementById(`vote-error-${pollId}`);
    const sel = [...(selectedOptions[pollId] || [])];

    if (!currentUser) { showVoteError(errEl, "로그인 후 투표할 수 있습니다."); return; }
    if (sel.length === 0) { showVoteError(errEl, "선택지를 선택해주세요."); return; }

    saveVote(poll, sel);
    delete selectedOptions[pollId];

    loadPolls();
    renderAll();
}

function showVoteError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
}

function showResult(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const contentEl = document.getElementById(`content-${pollId}`);
    const ended = isEnded(poll);

    if (contentEl) {
        contentEl.innerHTML = `
            <div class="result-list">${renderResultBar(poll)}</div>
            <div class="vote-actions mt-3">
              ${!ended ? `<button class="btn-go-vote" onclick="showVoteForm('${pollId}')">투표하러 가기</button>` : ""}
            </div>
        `;
    }
}

function showVoteForm(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const contentEl = document.getElementById(`content-${pollId}`);
    if (contentEl) {
        contentEl.innerHTML = renderVoteForm(poll);
    }
}

function confirmDelete(pollId) {
    const el = document.getElementById(`del-confirm-${pollId}`);
    if (el) el.classList.remove("hidden");
}

function cancelDelete(pollId) {
    const el = document.getElementById(`del-confirm-${pollId}`);
    if (el) el.classList.add("hidden");
}

function execDelete(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    deletePollFromStorage(poll);
    loadPolls();
    renderAll();
}

// ── 투표 생성 폼 ──────────────────────────────────────────────────────────
let formOptions = ["", ""];

function openCreateForm() {
    if (!currentUser) {
        alert("로그인이 필요합니다.");
        return;
    }

    formOptions = ["", ""];
    const modal = document.getElementById("createModal");
    if (modal) modal.classList.remove("hidden");

    document.getElementById("fTitle").value = "";
    document.getElementById("fQuestion").value = "";
    document.getElementById("fAnon").checked = false;
    document.getElementById("fMulti").checked = false;
    document.getElementById("fDeadlineToggle").checked = false;
    document.getElementById("deadlineFields").classList.add("hidden");
    document.getElementById("fDate").value = "";
    document.getElementById("fTime").value = "23:59";
    const fError = document.getElementById("fError");
    if (fError) fError.classList.add("hidden");
    renderFormOptions();
}

function closeCreateForm() {
    const modal = document.getElementById("createModal");
    if (modal) modal.classList.add("hidden");
}

function renderFormOptions() {
    const container = document.getElementById("optionsList");
    if (!container) return;
    container.innerHTML = formOptions.map((val, i) => `
        <div class="form-opt-row" id="formopt-${i}">
          <input
            type="text"
            class="form-input"
            placeholder="선택지 ${i + 1}"
            value="${escHtml(val)}"
            oninput="updateFormOption(${i}, this.value)"
          />
          ${formOptions.length > 2
        ? `<button class="btn-remove-opt" type="button" onclick="removeFormOption(${i})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>`
        : ""}
        </div>
    `).join("");
}

function updateFormOption(i, val) {
    formOptions[i] = val;
}

function addFormOption() {
    formOptions.push("");
    renderFormOptions();
}

function removeFormOption(i) {
    formOptions = formOptions.filter((_, idx) => idx !== i);
    renderFormOptions();
}

function toggleDeadlineFields() {
    const on = document.getElementById("fDeadlineToggle").checked;
    document.getElementById("deadlineFields").classList.toggle("hidden", !on);
}

function submitCreatePoll() {
    if (!currentUser) {
        alert("로그인이 필요합니다.");
        return;
    }

    const errEl = document.getElementById("fError");
    if (errEl) errEl.classList.add("hidden");

    const title = document.getElementById("fTitle").value.trim();
    const question = document.getElementById("fQuestion").value.trim();
    const isAnonymous = document.getElementById("fAnon").checked;
    const allowMultiple = document.getElementById("fMulti").checked;
    const useDeadline = document.getElementById("fDeadlineToggle").checked;
    const deadlineDate = document.getElementById("fDate").value;
    const deadlineTime = document.getElementById("fTime").value || "23:59";

    if (!title) { showFormError("투표 제목을 입력해주세요."); return; }
    if (!question) { showFormError("투표 질문을 입력해주세요."); return; }
    const validOpts = formOptions.map(o => o.trim()).filter(Boolean);
    if (validOpts.length < 2) { showFormError("선택지를 2개 이상 입력해주세요."); return; }
    if (useDeadline && !deadlineDate) { showFormError("마감 날짜를 선택해주세요."); return; }

    const stored = JSON.parse(localStorage.getItem("standalonePolls") || "[]");
    stored.unshift({
        id: Date.now().toString(),
        title,
        question,
        options: validOpts.map((t, i) => ({id: String(i), text: t})),
        isAnonymous,
        allowMultiple,
        endsAt: useDeadline ? new Date(`${deadlineDate}T${deadlineTime}`).toISOString() : null,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name || currentUser.username || "사용자",
        votes: [],
    });
    localStorage.setItem("standalonePolls", JSON.stringify(stored));

    closeCreateForm();
    loadPolls();
    renderAll();
}

function showFormError(msg) {
    const el = document.getElementById("fError");
    if (el) {
        el.textContent = msg;
        el.classList.remove("hidden");
    }
}

// ── 초기화 ────────────────────────────────────────────────────────────────
function init() {
    currentUser = getUser();
    loadPolls();
    renderAll();

    const createModal = document.getElementById("createModal");
    if (createModal) {
        createModal.addEventListener("click", function(e) {
            if (e.target === this) closeCreateForm();
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("openModal") === "true") {
        openCreateForm();
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

document.addEventListener("DOMContentLoaded", init);