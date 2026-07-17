// Calendar page functionality
let isViewAll = false;
window.loadEvents = window.loadEvents || (() => console.warn('loadEvents 미정의'));
window.requireAdmin = window.requireAdmin || (() => true);
window.getCurrentUser = window.getCurrentUser || (() => ({ username: 'Guest', isAdmin: true }));

if (typeof loadEvents !== 'function') window.loadEvents = () => console.warn('loadEvents 함수가 정의되지 않았습니다.');
if (typeof requireLogin !== 'function') window.requireLogin = () => true;
if (typeof isAdmin !== 'function') window.isAdmin = () => false;
if (typeof requireAdmin !== 'function') window.requireAdmin = () => true;
if (typeof getCurrentUser !== 'function') window.getCurrentUser = () => ({ username: 'Guest', isAdmin: true });

let currentDate = new Date();

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;

    if (isAdmin()) {
        document.getElementById('admin-controls')?.classList.remove('hidden');
    }

    renderCalendar();
    loadEvents();
    // 1. 일정 추가 버튼 (강제 연결)
    document.getElementById('add-event-btn').onclick = function(e) {
        const btnToggleAll = document.getElementById('btn-toggle-all');
        if (btnToggleAll) {
            btnToggleAll.onclick = function() {
                isViewAll = !isViewAll;
                this.textContent = isViewAll ? '이번 달 일정 보기' : '모든 일정 보기';
                this.className = isViewAll
                    ? "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    : "bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors";

                loadEvents(); // 리스트 갱신
            };
        }
        e.preventDefault();
        const modal = document.getElementById('event-modal');
        if(modal) {
            modal.style.display = 'flex';
            togglePeriodUI(false);

            // [추가] 모달 열 때 반복 컨테이너 숨김
            const container = document.getElementById('recurrence-end-container');
            if (container) container.classList.add('hidden');

            // [추가] 체크박스 해제
            const repeatCheckbox = document.getElementById('repeat-checkbox');
            if (repeatCheckbox) repeatCheckbox.checked = false;
        }
    };

    // 2. 카테고리 버튼 연결
    document.getElementById('btn-cat-study').onclick = () => updateCategoryUI('event');
    document.getElementById('btn-cat-activity').onclick = () => updateCategoryUI('club');


    // 3. 폼 제출 대신 버튼 클릭으로 제어 (이게 핵심)
    const submitBtn = document.getElementById('submit-event-btn');
    if(submitBtn) {
        submitBtn.onclick = function(e) {
            e.preventDefault();
            handleAddEvent();
        };
    }

    // 4. 모달 닫기
    document.getElementById('close-event-modal')?.addEventListener('click', resetAndCloseModal);

    // 5. 기타 UI 이벤트
    document.getElementById('btn-period-single')?.addEventListener('click', () => togglePeriodUI(false));
    document.getElementById('btn-period-range')?.addEventListener('click', () => togglePeriodUI(true));
    document.getElementById('prev-month')?.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); loadEvents();});
    document.getElementById('next-month')?.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); loadEvents();});


    // 반복 일정 체크박스 토글
    const repeatCheckbox = document.getElementById('repeat-checkbox');
    if (repeatCheckbox) {
        repeatCheckbox.addEventListener('change', function() {
            const container = document.getElementById('recurrence-end-container');
            if (container) container.classList.toggle('hidden', !this.checked);
        });
    }

    // 반복 주기 버튼 선택 로직 (매일 삭제, 보라색 테마)
    ['weekly', 'monthly', 'yearly'].forEach(type => {
        const btn = document.getElementById(`btn-recur-${type}`);
        if (btn) {
            btn.onclick = function() {
                document.getElementById('event-recurrence').value = type;

                // 모든 버튼을 기본 스타일로 초기화
                document.querySelectorAll('[id^="btn-recur-"]').forEach(b => {
                    b.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-white text-gray-500 border border-gray-200";
                });

                // 선택된 버튼만 보라색으로 강조
                this.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-purple-600 text-white";
            };
        }
    });
});

function togglePeriodUI(isRange) {
    const periodTypeInput = document.getElementById('event-period-type');
    const singleWrapper = document.getElementById('single-date-wrapper');
    const rangeWrapper = document.getElementById('range-date-wrapper');
    const btnSingle = document.getElementById('btn-period-single');
    const btnRange = document.getElementById('btn-period-range');

    periodTypeInput.value = isRange ? 'range' : 'single';

    // 입력창 토글
    if (singleWrapper) singleWrapper.classList.toggle('hidden', isRange);
    if (rangeWrapper) rangeWrapper.classList.toggle('hidden', !isRange);

    // 버튼 디자인 토글
    if (isRange) {
        btnSingle.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md text-gray-500 hover:text-gray-700 transition-all";
        btnRange.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white shadow-sm transition-all";
    } else {
        btnSingle.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white shadow-sm transition-all";
        btnRange.className = "cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md text-gray-500 hover:text-gray-700 transition-all";
    }
}

function setRecurrenceValue(value) {
    const recurrenceSelect = document.getElementById('event-recurrence');
    const recurrenceEndContainer = document.getElementById('recurrence-end-container');
    if (recurrenceSelect) recurrenceSelect.value = value;
    if (recurrenceEndContainer) recurrenceEndContainer.classList.toggle('hidden', value === 'none');
}
function resetAndCloseModal() {
    const eventModal = document.getElementById('event-modal');
    if (eventModal) {
        eventModal.style.display = 'none';
    }
    document.getElementById('event-form')?.reset();

    // [추가] 모달 닫을 때 반복 설정 컨테이너 숨김
    const container = document.getElementById('recurrence-end-container');
    if (container) container.classList.add('hidden');

    // [추가] 체크박스 해제
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
    document.getElementById('current-month').textContent = `${year}년 ${month + 1}월`;

    const events = JSON.parse(localStorage.getItem('events') || '[]');
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

        // 해당 날짜에 있는 이벤트 필터링
        const dayEvents = events.filter(e => {
            // 예외 날짜(exceptions)에 포함된 경우 제외
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

        // 클릭 이벤트 추가
        dayDiv.onclick = function() {
            if (dayEvents.length === 0) return;
            const evt = dayEvents[0];
            const modal = document.getElementById('view-event-modal');
            const delBtn = document.getElementById('view-event-delete-btn');

            document.getElementById('view-event-title').textContent = evt.title;
            document.getElementById('view-event-desc').innerHTML = `<p class="mb-2"><strong>날짜:</strong> ${dateStr}</p><p><strong>설명:</strong> ${evt.description || '설명 없음'}</p>`;

            // 관리자 여부에 따라 삭제 버튼 보이기/숨기기
            if (requireAdmin()) {
                delBtn.classList.remove('hidden');
                delBtn.onclick = function() {
                    if (confirm('정말 이 날짜의 일정만 삭제하시겠습니까?')) {
                        deleteEvent(evt.id, dateStr);
                        modal.classList.add('hidden');
                    }
                };
            } else {
                delBtn.classList.add('hidden');
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


function handleAddEvent() {
    const title = document.getElementById('event-title').value.trim();
    const periodType = document.getElementById('event-period-type')?.value || 'single';
    const startDate = periodType === 'single' ? document.getElementById('event-start-date').value : document.getElementById('event-range-start').value;
    const endDate = periodType === 'single' ? startDate : document.getElementById('event-range-end').value;

    // 반복 관련 데이터
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
        description: document.getElementById('event-description').value.trim(), // [추가] 설명 저장
        category: document.getElementById('event-category')?.value || 'event',
        recurrence: isRepeat ? recurrence : 'none',
        recurrenceEnd: recurrenceEnd || '9999-12-31'
    };

    const events = JSON.parse(localStorage.getItem('events') || '[]');
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));

    // UI 정리
    document.getElementById('event-modal').style.display = 'none';
    document.getElementById('event-form').reset();

    // 달력 새로고침
    renderCalendar();
    loadEvents();
}

function viewEvent(eventId) {
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const event = events.find(e => e.id === eventId);

    if (!event) return;

    const eventDate = new Date(event.date);
    const dateStr = `${eventDate.getFullYear()}년 ${eventDate.getMonth() + 1}월 ${eventDate.getDate()}일`;

    let message = `${event.title}\n${dateStr}`;
    if (event.description) {
        message += `\n\n${event.description}`;
    }

    alert(message);
}

function deleteEvent(eventId, clickedDate = null) {
    if (!requireAdmin()) return;
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        el.querySelector('p').textContent = msg;
    }
}
function loadEvents() {
    const listContainer = document.getElementById('events-list');
    if (!listContainer) return;

    // [중복 제거 핵심] 리스트를 그리기 전에 기존 내용을 모두 지움
    listContainer.innerHTML = '';

    const events = JSON.parse(localStorage.getItem('events') || '[]');

    // 모드에 따라 필터링 (isViewAll이 true면 전체 표시, false면 이번 달만)
    const displayEvents = isViewAll ? events : events.filter(evt => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 이번 달의 범위 설정
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        // 1. 반복 일정이 아닌 경우: 기존 일반 일정 필터링
        if (!evt.recurrence || evt.recurrence === 'none') {
            const start = new Date(evt.startDate);
            const end = new Date(evt.endDate || evt.startDate);
            return start <= monthEnd && end >= monthStart;
        }

        // 2. 반복 일정인 경우: 종료일(recurrenceEnd) 체크 및 이번 달 포함 여부 확인
        const recEnd = new Date(evt.recurrenceEnd || '9999-12-31');
        if (recEnd < monthStart) return false; // 종료일이 이번 달 이전이면 제외

        const start = new Date(evt.startDate);
        if (start > monthEnd) return false; // 시작일이 이번 달 이후면 제외

        // 주기별 세부 조건
        if (evt.recurrence === 'weekly') return true;
        if (evt.recurrence === 'monthly') return true;
        if (evt.recurrence === 'yearly') return start.getMonth() === month;

        return false;
    });

    displayEvents.forEach(evt => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50';

        // [수정된 부분] 반복 일정별 기간 표시
        let dateText = `${evt.startDate} ~ ${evt.endDate}`;

        if (evt.recurrence && evt.recurrence !== 'none') {
            const endLabel = evt.recurrenceEnd === '9999-12-31' ? '무기한' : evt.recurrenceEnd;
            if (evt.recurrence === 'weekly') {
                dateText = `매주 반복 (${evt.startDate} ~ ${endLabel})`;
            } else if (evt.recurrence === 'monthly') {
                dateText = `매월 반복 (${evt.startDate} ~ ${endLabel})`;
            } else if (evt.recurrence === 'yearly') {
                dateText = `매년 반복 (${evt.startDate} ~ ${endLabel})`;
            }
        }

        item.innerHTML = `
        <div>
            <span class="font-bold text-gray-800">${evt.title}</span>
            <div class="text-xs text-blue-600 font-medium">${dateText}</div>
        </div>
        <button onclick="deleteEvent('${evt.id}')" class="text-xs text-red-500 hover:underline px-2 py-1">삭제</button>
    `;
        listContainer.appendChild(item);
    });
}