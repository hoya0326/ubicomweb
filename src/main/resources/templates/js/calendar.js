// Calendar page functionality

let currentDate = new Date();

document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;
    
    // Show admin controls if user is admin
    if (isAdmin()) {
        document.getElementById('admin-controls').classList.remove('hidden');
    }
    
    renderCalendar();
    loadEvents();
    
    // Month navigation
    document.getElementById('prev-month').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        loadEvents();
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        loadEvents();
    });
    
    // Add event modal
    const addEventBtn = document.getElementById('add-event-btn');
    const eventModal = document.getElementById('event-modal');
    const closeEventModal = document.getElementById('close-event-modal');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    
    if (addEventBtn) {
        addEventBtn.addEventListener('click', function() {
            if (!requireAdmin()) return;
            eventModal.classList.remove('hidden');
        });
    }
    
    closeEventModal.addEventListener('click', function() {
        eventModal.classList.add('hidden');
        document.getElementById('event-form').reset();
        hideError('event-error');
    });
    
    cancelEventBtn.addEventListener('click', function() {
        eventModal.classList.add('hidden');
        document.getElementById('event-form').reset();
        hideError('event-error');
    });
    
    // Event form
    document.getElementById('event-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleAddEvent();
    });
});

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month title
    document.getElementById('current-month').textContent = 
        `${year}년 ${month + 1}월`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Get events for this month
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
    // Create calendar days
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.innerHTML = `<div class="font-semibold text-sm">${day}</div>`;
        calendarDays.appendChild(dayDiv);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        // Highlight today
        if (isCurrentMonth && day === todayDate) {
            dayDiv.classList.add('today');
        }
        
        // Find events for this day
        const dayEvents = monthEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day;
        });
        
        let dayHTML = `<div class="font-semibold text-sm mb-1">${day}</div>`;
        
        // Add events
        dayEvents.forEach(event => {
            dayHTML += `<div class="calendar-event" onclick="viewEvent('${event.id}')" title="${escapeHtml(event.title)}">${escapeHtml(event.title)}</div>`;
        });
        
        dayDiv.innerHTML = dayHTML;
        calendarDays.appendChild(dayDiv);
    }
    
    // Next month days
    const remainingDays = 42 - (firstDay + daysInMonth); // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.innerHTML = `<div class="font-semibold text-sm">${day}</div>`;
        calendarDays.appendChild(dayDiv);
    }
}

function loadEvents() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
    // Sort by date
    monthEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const eventsList = document.getElementById('events-list');
    
    if (monthEvents.length === 0) {
        eventsList.innerHTML = '<p class="text-gray-500 text-center py-4">이번 달 일정이 없습니다.</p>';
        return;
    }
    
    eventsList.innerHTML = monthEvents.map(event => {
        const eventDate = new Date(event.date);
        const dateStr = `${eventDate.getMonth() + 1}월 ${eventDate.getDate()}일`;
        
        return `
            <div class="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-blue-600 font-semibold">${dateStr}</span>
                        <span class="font-medium">${escapeHtml(event.title)}</span>
                    </div>
                    ${event.description ? `<p class="text-sm text-gray-600">${escapeHtml(event.description)}</p>` : ''}
                </div>
                ${isAdmin() ? `
                    <button onclick="deleteEvent('${event.id}')" class="text-red-600 hover:text-red-700 text-sm ml-2">
                        삭제
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function handleAddEvent() {
    hideError('event-error');
    
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value.trim();
    
    if (!title || !date) {
        showError('event-error', '제목과 날짜를 입력해주세요.');
        return;
    }
    
    const user = getCurrentUser();
    if (!user || !user.isAdmin) {
        showError('event-error', '관리자만 일정을 추가할 수 있습니다.');
        return;
    }
    
    const newEvent = {
        id: Date.now().toString(),
        title: title,
        date: date,
        description: description,
        author: user.username,
        createdAt: new Date().toISOString()
    };
    
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    
    // Close modal and reset form
    document.getElementById('event-modal').classList.add('hidden');
    document.getElementById('event-form').reset();
    
    // Reload calendar and events
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

function deleteEvent(eventId) {
    if (!requireAdmin()) return;
    
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) {
        return;
    }
    
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const filteredEvents = events.filter(e => e.id !== eventId);
    localStorage.setItem('events', JSON.stringify(filteredEvents));
    
    // Reload calendar and events
    renderCalendar();
    loadEvents();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
