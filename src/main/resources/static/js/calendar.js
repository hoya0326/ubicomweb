"use strict";

// ── 1. 글로벌 상태 및 초기화 ───────────────────────────
let isViewAll = false;
let currentDate = new Date();
let currentUser = null;

// 공통 인증 상태 확인 함수 (UserApiController 기반)
function checkAuthStatus() {
    const u = localStorage.getItem("currentUser");
    currentUser = u ? JSON.parse(u) : null;
    return currentUser;
}

function isAdmin() {
    checkAuthStatus();
    return currentUser && currentUser.isAdmin === true;
}

document.addEventListener('DOMContentLoaded', function() {
    // 세션 정보 최신화
    checkAuthStatus();

    // 관리자일 경우에만 관리자 전용 컨트롤 UI 노출
    if (isAdmin()) {
        document.getElementById('admin-controls')?.classList.remove('hidden');
    } else {
        document.getElementById('admin-controls')?.classList.add('hidden');
    }

    // 기본 캘린더 및 리스트 렌더링
    renderCalendar();
    loadEvents();

    // 2. [수정] 모든 일정 보기 / 이번 달 일정 보기 토글 버튼
    const btnToggleAll = document.getElementById('btn-toggle-all');
    if (btnToggleAll) {
        btnToggleAll.onclick = function() {
            isViewAll = !isViewAll;
            this.textContent = isViewAll ? '이번 달 일정 보기' : '모든 일정 보기';
            this.className = isViewAll
                ? "cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                : "cursor-pointer bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors";

            // ✨ [추가] 하단 리스트의 h2 타이틀 문구를 조건에 맞게 변경합니다.
            const listTitle = document.querySelector('#events-list').previousElementSibling;
            if (listTitle && listTitle.tagName === 'H2') {
                listTitle.textContent = isViewAll ? '모든 일정' : '이번 달 일정';
            }

            loadEvents(); // 리스트 갱신
        };
    }

    // 3. 일정 추가 모달 열기 버튼
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.onclick = function(e) {
            e.preventDefault();

            if (!isAdmin()) {
                alert("일정 추가 권한이 없습니다.");
                return;
            }

            const modal = document.getElementById('event-modal');
            if(modal) {
                modal.style.display = 'flex';
                togglePeriodUI(false);

                // 모달 초기 상태 정돈
                const container = document.getElementById('recurrence-end-container');
                if (container) container.classList.add('hidden');

                const repeatCheckbox = document.getElementById('repeat-checkbox');
                if (repeatCheckbox) repeatCheckbox.checked = false;
            }
        };
    }

    // 4. 카테고리 선택 버튼 이벤트 바인딩
    const btnStudy = document.getElementById('btn-cat-study');
    if (btnStudy) btnStudy.onclick = () => updateCategoryUI('event');

    const btnActivity = document.getElementById('btn-cat-activity');
    if (btnActivity) btnActivity.onclick = () => updateCategoryUI('club');

    // 5. 일정 저장 버튼 비동기 제어
    const submitBtn = document.getElementById('submit-event-btn');
    if(submitBtn) {
        submitBtn.onclick = function(e) {
            e.preventDefault();
            handleAddEvent();
        };
    }

    // 6. 모달 닫기 및 기타 UI 내비게이션 이벤트
    document.getElementById('close-event-modal')?.addEventListener('click', resetAndCloseModal);
    document.getElementById('btn-period-single')?.addEventListener('click', () => togglePeriodUI(false));
    document.getElementById('btn-period-range')?.addEventListener('click', () => togglePeriodUI(true));

    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        loadEvents();
    });
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        loadEvents();
    });

    // 반복 일정 체크박스 디스플레이 핸들러
    const repeatCheckbox = document.getElementById('repeat-checkbox');
    if (repeatCheckbox) {
        repeatCheckbox.addEventListener('change', function() {
            const container = document.getElementById('recurrence-end-container');
            if (container) container.classList.toggle('hidden', !this.checked);
        });
    }

    // 반복 주기 선택 버튼 활성화 스타일 제어
    ['weekly', 'monthly', 'yearly'].forEach(type => {
        const btn = document.getElementById(`btn-recur-${type}`);
        if (btn) {
            btn.onclick = function() {
                const hiddenRecurInput = document.getElementById('event-recurrence');
                if (hiddenRecurInput) hiddenRecurInput.value = type;

                document.querySelectorAll('[id^="btn-recur-"]').forEach(b => {
                    b.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-white text-gray-500 border border-gray-200";
                });
                this.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-purple-600 text-white";
            };
        }
    });
});

// ── 7. UI 제어 및 캘린더 코어 엔진 ───────────────────────────
function togglePeriodUI(isRange) {
    const periodTypeInput = document.getElementById('event-period-type');
    const singleWrapper = document.getElementById('single-date-wrapper');
    const rangeWrapper = document.getElementById('range-date-wrapper');
    const btnSingle = document.getElementById('btn-period-single');
    const btnRange = document.getElementById('btn-period-range');

    if (periodTypeInput) periodTypeInput.value = isRange ? 'range' : 'single';

    if (singleWrapper) singleWrapper.classList.toggle('hidden', isRange);
    if (rangeWrapper) rangeWrapper.classList.toggle('hidden', !isRange);

    if (isRange) {
        if (btnSingle) btnSingle.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md text-gray-500 hover:text-gray-700 transition-all";
        if (btnRange) btnRange.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white shadow-sm transition-all";
    } else {
        if (btnSingle) btnSingle.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white shadow-sm transition-all";
        if (btnRange) btnRange.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md text-gray-500 hover:text-gray-700 transition-all";
    }
}

function resetAndCloseModal() {
    const eventModal = document.getElementById('event-modal');
    if (eventModal) eventModal.style.display = 'none';

    document.getElementById('event-form')?.reset();

    const container = document.getElementById('recurrence-end-container');
    if (container) container.classList.add('hidden');

    const repeatCheckbox = document.getElementById('repeat-checkbox');
    if (repeatCheckbox) repeatCheckbox.checked = false;

    renderCalendar();
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const currentMonthEl = document.getElementById('current-month');
    if (currentMonthEl) currentMonthEl.textContent = `${year}년 ${month + 1}월`;

    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 첫 주 빈칸 매핑
    for (let i = 0; i < firstDay; i++) {
        calendarDays.appendChild(document.createElement('div')).className = 'calendar-day';
    }

    // 날짜 칸 빌드
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day border-t border-l border-gray-100 cursor-pointer hover:bg-gray-50';
        dayDiv.innerHTML = `<div class="day-number text-xs text-gray-500">${day}</div>`;

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const targetDate = new Date(dateStr);

        const dayEvents = events.filter(e => {
            if (e.exceptions && e.exceptions.includes(dateStr)) return false;
            if (dateStr >= e.startDate && dateStr <= e.endDate) return true;

            if (e.recurrence && e.recurrence !== 'none' && dateStr <= e.recurrenceEnd) {
                const start = new Date(e.startDate);
                if (e.recurrence === 'weekly') return dateStr >= e.startDate && targetDate.getDay() === start.getDay();
                if (e.recurrence === 'monthly') return dateStr >= e.startDate && targetDate.getDate() === start.getDate();
                if (e.recurrence === 'yearly') return dateStr >= e.startDate && (targetDate.getMonth() === start.getMonth()) && (targetDate.getDate() === start.getDate());
            }
            return false;
        });

        dayDiv.onclick = function() {
            if (dayEvents.length === 0) return;
            const evt = dayEvents[0];
            const modal = document.getElementById('view-event-modal');
            const delBtn = document.getElementById('view-event-delete-btn');

            if (!modal) return;

            document.getElementById('view-event-title').textContent = evt.title;
            document.getElementById('view-event-desc').innerHTML = `<p class="mb-2"><strong>날짜:</strong> ${dateStr}</p><p><strong>설명:</strong> ${escapeHtml(evt.description || '설명 없음')}</p>`;

            // ✨ [수정] 하드코딩 함수가 아닌 실제 DB 권한 상태(isAdmin())를 대조하여 삭제 분기 처리
            if (isAdmin()) {
                if (delBtn) {
                    delBtn.classList.remove('hidden');
                    delBtn.onclick = function() {
                        if (confirm('정말 이 날짜의 일정만 삭제하시겠습니까?')) {
                            deleteEvent(evt.id, dateStr);
                            modal.classList.add('hidden');
                        }
                    };
                }
            } else {
                if (delBtn) delBtn.classList.add('hidden');
            }

            modal.classList.remove('hidden');
        };

        dayEvents.forEach(evt => {
            const bar = document.createElement('div');
            bar.className = `text-[10px] px-1 rounded mb-0.5 truncate ${evt.category === 'club' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`;
            bar.textContent = evt.title;
            dayDiv.appendChild(bar);
        });

        calendarDays.appendChild(dayDiv);
    }
}

// ── 8. 비즈니스 백엔드 트랜잭션 라우터 ───────────────────────────
function handleAddEvent() {
    if (!isAdmin()) {
        alert("일정을 추가할 수 있는 권한이 없습니다.");
        return;
    }

    const title = document.getElementById('event-title').value.trim();
    const periodType = document.getElementById('event-period-type')?.value || 'single';
    const startDate = periodType === 'single' ? document.getElementById('event-start-date').value : document.getElementById('event-range-start').value;
    const endDate = periodType === 'single' ? startDate : document.getElementById('event-range-end').value;

    const isRepeat = document.getElementById('repeat-checkbox')?.checked;
    const recurrence = document.getElementById('event-recurrence')?.value;
    const recurrenceEnd = document.getElementById('event-recurrence-end')?.value;

    if (!title || !startDate || !endDate) {
        alert('제목과 날짜를 입력해주세요.');
        return;
    }

    const newEvent = {
        id: Date.now().toString(),
        title: title,
        startDate: startDate,
        endDate: endDate,
        description: document.getElementById('event-description')?.value.trim() || '',
        category: document.getElementById('event-category')?.value || 'event',
        recurrence: isRepeat ? recurrence : 'none',
        recurrenceEnd: isRepeat && recurrenceEnd ? recurrenceEnd : '9999-12-31'
    };

    const events = JSON.parse(localStorage.getItem('events') || '[]');
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));

    document.getElementById('event-modal').style.display = 'none';
    document.getElementById('event-form').reset();

    renderCalendar();
    loadEvents();
}

function deleteEvent(eventId, clickedDate = null) {
    // ✨ [수정] 안전 차단 가드를 실시간 DB 세션 권한으로 통합
    if (!isAdmin()) {
        alert("일정 권한 수정 및 삭제는 관리자만 가능합니다.");
        return;
    }

    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;

    if (!clickedDate) {
        if (!confirm('정말 이 일정을 완전히 삭제하시겠습니까?')) return;
        events.splice(eventIndex, 1);
    } else {
        if (!events[eventIndex].exceptions) events[eventIndex].exceptions = [];
        events[eventIndex].exceptions.push(clickedDate);
    }

    localStorage.setItem('events', JSON.stringify(events));
    renderCalendar();
    loadEvents();
}

function loadEvents() {
    const listContainer = document.getElementById('events-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const events = JSON.parse(localStorage.getItem('events') || '[]');

    const displayEvents = isViewAll ? events : events.filter(evt => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        if (!evt.recurrence || evt.recurrence === 'none') {
            const start = new Date(evt.startDate);
            const end = new Date(evt.endDate || evt.startDate);
            return start <= monthEnd && end >= monthStart;
        }

        const recEnd = new Date(evt.recurrenceEnd || '9999-12-31');
        if (recEnd < monthStart) return false;

        const start = new Date(evt.startDate);
        if (start > monthEnd) return false;

        if (evt.recurrence === 'weekly') return true;
        if (evt.recurrence === 'monthly') return true;
        if (evt.recurrence === 'yearly') return start.getMonth() === month;

        return false;
    });

    displayEvents.forEach(evt => {
        const item = document.createElement('div');
        // ✨ [수정] 클릭 가능한 커서 스타일(cursor-pointer) 및 hover 효과 추가
        item.className = 'flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors';

        let dateText = `${evt.startDate} ~ ${evt.endDate}`;
        if (evt.recurrence && evt.recurrence !== 'none') {
            const endLabel = evt.recurrenceEnd === '9999-12-31' ? '무기한' : evt.recurrenceEnd;
            if (evt.recurrence === 'weekly') dateText = `매주 반복 (${evt.startDate} ~ ${endLabel})`;
            else if (evt.recurrence === 'monthly') dateText = `매월 반복 (${evt.startDate} ~ ${endLabel})`;
            else if (evt.recurrence === 'yearly') dateText = `매년 반복 (${evt.startDate} ~ ${endLabel})`;
        }

        // ✨ [추가] 카드 자체를 클릭했을 때 상세보기 모달을 띄우는 이벤트 바인딩
        item.onclick = function(e) {
            // 삭제 버튼을 누른 경우는 상세보기 모달이 뜨지 않도록 방어 코드 추가
            if (e.target.tagName === 'BUTTON') return;

            const modal = document.getElementById('view-event-modal');
            const delBtn = document.getElementById('view-event-delete-btn');
            if (!modal) return;

            document.getElementById('view-event-title').textContent = evt.title;
            // 리스트에서 볼 때는 단일 예외 날짜가 아닌 전체 기간(dateText) 혹은 시작일을 보여줍니다.
            document.getElementById('view-event-desc').innerHTML = `
                <p class="mb-2"><strong>기간:</strong> ${dateText}</p>
                <p><strong>설명:</strong> ${escapeHtml(evt.description || '설명 없음')}</p>
            `;

            if (isAdmin()) {
                if (delBtn) {
                    delBtn.classList.remove('hidden');
                    delBtn.onclick = function() {
                        if (confirm('정말 이 일정을 완전히 삭제하시겠습니까?')) {
                            // 리스트에서 삭제할 때는 특정 날짜 예외처리가 아니라 '전체 삭제'이므로 두 번째 인자를 넘기지 않습니다.
                            deleteEvent(evt.id);
                            modal.classList.add('hidden');
                        }
                    };
                }
            } else {
                if (delBtn) delBtn.classList.add('hidden');
            }

            modal.classList.remove('hidden');
        };

        const deleteButtonHtml = isAdmin()
            ? `<button onclick="deleteEvent('${evt.id}')" class="text-xs text-red-500 hover:underline px-2 py-1 relative z-10">삭제</button>`
            : '';

        item.innerHTML = `
            <div>
                <span class="font-bold text-gray-800">${escapeHtml(evt.title)}</span>
                <div class="text-xs text-blue-600 font-medium">${dateText}</div>
            </div>
            ${deleteButtonHtml}
        `;
        listContainer.appendChild(item);
    });
}

function updateCategoryUI(category) {
    const hiddenInput = document.getElementById('event-category');
    const btnStudy = document.getElementById('btn-cat-study');
    const btnActivity = document.getElementById('btn-cat-activity');
    if (!hiddenInput || !btnStudy || !btnActivity) return;

    hiddenInput.value = category;
    btnStudy.className = category === 'event' ?
        "cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-blue-500 bg-blue-50 text-blue-600 text-sm font-semibold transition-all" :
        "cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 bg-white text-sm font-semibold transition-all";
    btnActivity.className = category === 'club' ?
        "cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-green-500 bg-green-50 text-green-600 text-sm font-semibold transition-all" :
        "cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 bg-white text-sm font-semibold transition-all";
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}