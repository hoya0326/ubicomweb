"use strict";

// ── 1. 글로벌 상태 및 초기화 ───────────────────────────
let isViewAll = false;
let currentDate = new Date();
let currentUser = null;
let cachedEvents = []; // DB에서 가져온 일정 메모리 캐시

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

document.addEventListener('DOMContentLoaded', async function () {
    if (typeof requireLogin === 'function' && !requireLogin()) return;

    // 세션 정보 최신화
    checkAuthStatus();

    // 관리자일 경우에만 관리자 전용 컨트롤 UI 노출
    const adminControls = document.getElementById('admin-controls');
    if (adminControls) {
        adminControls.classList.toggle('hidden', !isAdmin());
    }

    // 초기 일정 목록 DB에서 로드 후 캘린더/리스트 렌더링
    await fetchAndRenderSchedules();

    // 2. 모든 일정 보기 / 이번 달 일정 보기 토글 버튼
    const btnToggleAll = document.getElementById('btn-toggle-all');
    if (btnToggleAll) {
        btnToggleAll.onclick = function () {
            isViewAll = !isViewAll;
            this.textContent = isViewAll ? '이번 달 일정 보기' : '모든 일정 보기';
            this.className = isViewAll
                ? "cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                : "cursor-pointer bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors";

            const listTitle = document.querySelector('#events-list')?.previousElementSibling;
            if (listTitle && listTitle.tagName === 'H2') {
                listTitle.textContent = isViewAll ? '모든 일정' : '이번 달 일정';
            }

            loadEvents(); // 리스트 갱신
        };
    }

    // 3. 일정 추가 모달 열기 버튼
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.onclick = function (e) {
            e.preventDefault();

            if (!isAdmin()) {
                alert("일정 추가 권한이 없습니다.");
                return;
            }

            const modal = document.getElementById('event-modal');
            if (modal) {
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
    if (submitBtn) {
        submitBtn.onclick = function (e) {
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
        repeatCheckbox.addEventListener('change', function () {
            const container = document.getElementById('recurrence-end-container');
            if (container) container.classList.toggle('hidden', !this.checked);
        });
    }

    // 반복 주기 선택 버튼 활성화 스타일 제어
    ['weekly', 'monthly', 'yearly'].forEach(type => {
        const btn = document.getElementById(`btn-recur-${type}`);
        if (btn) {
            btn.onclick = function () {
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


// ── 2. REST API 연동 데이터 로드 ───────────────────────────
async function fetchAndRenderSchedules() {
    try {
        const response = await fetch('/api/schedules');
        if (!response.ok) throw new Error('일정 목록을 가져오는데 실패했습니다.');

        cachedEvents = await response.json();
        renderCalendar();
        loadEvents();
    } catch (error) {
        console.error('일정 데이터 로드 중 오류 발생:', error);
    }
}


// ── 3. UI 제어 및 캘린더 코어 엔진 ───────────────────────────
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

function formatEventDateText(evt) {
    let dateText = `${evt.startDate}${evt.startTime ? ' ' + evt.startTime : ''}`;
    if (evt.startDate !== evt.endDate || (evt.endTime && evt.endTime !== evt.startTime)) {
        dateText += ` ~ ${evt.endDate}${evt.endTime ? ' ' + evt.endTime : ''}`;
    }

    if (evt.recurrence && evt.recurrence !== 'none') {
        const endLabel = evt.recurrenceEnd === '9999-12-31' ? '무기한' : evt.recurrenceEnd;
        if (evt.recurrence === 'weekly') dateText = `매주 반복 (${dateText} ~ ${endLabel})`;
        else if (evt.recurrence === 'monthly') dateText = `매월 반복 (${dateText} ~ ${endLabel})`;
        else if (evt.recurrence === 'yearly') dateText = `매년 반복 (${dateText} ~ ${endLabel})`;
    }
    return dateText;
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const currentMonthEl = document.getElementById('current-month');
    if (currentMonthEl) currentMonthEl.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarDays.appendChild(document.createElement('div')).className = 'calendar-day';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day border-t border-l border-gray-100 cursor-pointer hover:bg-gray-50';
        dayDiv.innerHTML = `<div class="day-number text-xs text-gray-500">${day}</div>`;

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const targetDate = new Date(dateStr);

        const dayEvents = cachedEvents.filter(e => {
            if (e.exceptions && e.exceptions.includes(dateStr)) return false;
            if (dateStr >= e.startDate && dateStr <= e.endDate) return true;

            if (e.recurrence && e.recurrence !== 'none' && dateStr <= (e.recurrenceEnd || '9999-12-31')) {
                const start = new Date(e.startDate);
                if (e.recurrence === 'weekly') return dateStr >= e.startDate && targetDate.getDay() === start.getDay();
                if (e.recurrence === 'monthly') return dateStr >= e.startDate && targetDate.getDate() === start.getDate();
                if (e.recurrence === 'yearly') return dateStr >= e.startDate && (targetDate.getMonth() === start.getMonth()) && (targetDate.getDate() === start.getDate());
            }
            return false;
        });

        // 캘린더 날짜 타일 클릭 시 (개별 날짜 모달 오픈)
        dayDiv.onclick = function () {
            if (dayEvents.length === 0) return;
            const evt = dayEvents[0];
            const modal = document.getElementById('view-event-modal');
            const delBtn = document.getElementById('view-event-delete-btn');

            if (!modal) return;

            document.getElementById('view-event-title').textContent = evt.title;
            document.getElementById('view-event-desc').innerHTML = `<p class="mb-2"><strong>일정 기간:</strong> ${formatEventDateText(evt)}</p><p><strong>설명:</strong> ${escapeHtml(evt.description || '설명 없음')}</p>`;

            // 관리자 권한 제어
            if (isAdmin()) {
                if (delBtn) {
                    delBtn.classList.remove('hidden');
                    if (evt.recurrence && evt.recurrence !== 'none') {
                        delBtn.textContent = '이 날짜 일정만 삭제';
                    } else {
                        delBtn.textContent = '일정 삭제';
                    }

                    delBtn.onclick = function () {
                        const isRepeat = evt.recurrence && evt.recurrence !== 'none';
                        const confirmMsg = isRepeat
                            ? `${dateStr} 일자 일정만 삭제하시겠습니까?`
                            : '이 일정을 삭제하시겠습니까?';

                        if (confirm(confirmMsg)) {
                            deleteEvent(evt.id, isRepeat ? dateStr : null);
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


// ── 4. 비즈니스 백엔드 트랜잭션 라우터 ───────────────────────────
async function handleAddEvent() {
    if (!isAdmin()) {
        alert("일정을 추가할 수 있는 권한이 없습니다.");
        return;
    }

    const titleInput = document.getElementById('event-title');
    const title = titleInput ? titleInput.value.trim() : '';
    const periodType = document.getElementById('event-period-type')?.value || 'single';

    let startDate, startTime, endDate, endTime;

    if (periodType === 'single') {
        startDate = document.getElementById('event-start-date').value;
        startTime = document.getElementById('event-start-time').value || null;
        endDate = startDate;
        endTime = startTime;
    } else {
        startDate = document.getElementById('event-range-start').value;
        startTime = document.getElementById('event-range-start-time').value || null;
        endDate = document.getElementById('event-range-end').value;
        endTime = document.getElementById('event-range-end-time').value || null;
    }

    const isRepeat = document.getElementById('repeat-checkbox')?.checked;
    const recurrence = document.getElementById('event-recurrence')?.value || 'none';
    const recurrenceEnd = document.getElementById('event-recurrence-end')?.value;

    if (!title || !startDate || !endDate) {
        alert('제목과 날짜를 입력해주세요.');
        return;
    }

    const payload = {
        title: title,
        startDate: startDate,
        startTime: startTime,
        endDate: endDate,
        endTime: endTime,
        description: document.getElementById('event-description')?.value.trim() || '',
        category: document.getElementById('event-category')?.value || 'event',
        recurrence: isRepeat ? recurrence : 'none',
        recurrenceEnd: isRepeat && recurrenceEnd ? recurrenceEnd : '9999-12-31'
    };

    const submitBtn = document.getElementById('submit-event-btn');

    try {
        if (submitBtn) submitBtn.disabled = true;

        const response = await fetch('/api/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || '일정 등록에 실패했습니다.');
        }

        resetAndCloseModal();
        await fetchAndRenderSchedules();

    } catch (error) {
        console.error('일정 추가 실패:', error);
        alert(error.message || '서버 통신 실패');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function deleteEvent(eventId, clickedDate = null) {
    if (!isAdmin()) {
        alert("일정 권한 수정 및 삭제는 관리자만 가능합니다.");
        return;
    }

    try {
        if (!clickedDate) {
            if (!confirm('정말 이 일정을 완전히 삭제하시겠습니까?')) return;

            const response = await fetch(`/api/schedules/${eventId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '일정 삭제 실패');
            }
        } else {
            const response = await fetch(`/api/schedules/${eventId}/exception?dateStr=${encodeURIComponent(clickedDate)}`, {
                method: 'POST'
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '날짜 제외 실패');
            }
        }

        await fetchAndRenderSchedules();

    } catch (error) {
        console.error('일정 삭제 오류:', error);
        alert(error.message || '삭제 처리 중 오류가 발생했습니다.');
    }
}

// ── 일정 목록 렌더링 ───────────────────────────
function loadEvents() {
    const listContainer = document.getElementById('events-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const displayEvents = isViewAll ? cachedEvents : cachedEvents.filter(evt => {
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
        item.className = 'flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors';

        const dateText = formatEventDateText(evt);

        // 목록 아이템 클릭 시 (전체 일정 정보 모달 오픈)
        item.onclick = function (e) {
            if (e.target.tagName === 'BUTTON') return;

            const modal = document.getElementById('view-event-modal');
            const delBtn = document.getElementById('view-event-delete-btn');
            if (!modal) return;

            document.getElementById('view-event-title').textContent = evt.title;
            document.getElementById('view-event-desc').innerHTML = `
                <p class="mb-2"><strong>일정 기간:</strong> ${dateText}</p>
                <p><strong>설명:</strong> ${escapeHtml(evt.description || '설명 없음')}</p>
            `;

            if (isAdmin()) {
                if (delBtn) {
                    delBtn.classList.remove('hidden');
                    delBtn.textContent = '일정 전체 삭제';
                    delBtn.onclick = function () {
                        if (confirm('정말 이 일정을 완전히 삭제하시겠습니까? (반복 규칙 포함)')) {
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
            ? `<button onclick="event.stopPropagation(); deleteEvent('${evt.id}')" class="text-xs text-red-500 hover:underline px-2 py-1 relative z-10">삭제</button>`
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