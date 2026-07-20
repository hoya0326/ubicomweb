// apply.js

let currentAppContainer = null;

function renderApplicationList(container) {
    currentAppContainer = container;
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');

    const formatDate = (dateString) => {
        if(!dateString) return '';
        const d = new Date(dateString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    container.innerHTML = `
        <div class="mb-8 bg-white rounded-lg shadow-md border border-blue-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100 bg-white">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="text-blue-600 bg-blue-50 p-2.5 rounded-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-900">2학기 신규회원 가입 신청 현황</h2>
                            <p class="text-sm text-gray-500 mt-0.5">총 ${applications.length}건의 신청이 접수되었습니다.</p>
                        </div>
                    </div>
                    ${applications.length > 0 ? `
                        <span class="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
                            신규 ${applications.length}건
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="p-6 bg-gray-50/40">
                ${applications.length === 0 ? `
                    <div class="text-center py-12 text-gray-400">
                        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                        </svg>
                        아직 대기 중인 가입 신청서가 없습니다.
                    </div>
                ` : `
                    <div class="flex flex-col gap-3" id="applications-list">
                        ${applications.map(app => {
        const expMap = { none: '없음 (완전 처음이에요)', beginner: '초급', intermediate: '중급', advanced: '고급' };
        const genderMap = { m: '남성', f: '여성' };
        const yesNoMap = { yes: '네', no: '아니오' }; // 💡 추가된 변환 로직

        const expLabel = expMap[app.experience] || app.experience || '-';
        const genderLabel = genderMap[app.gender] || app.gender || '-';

        // 💡 추가된 필드들 변환 적용
        const prevMemberLabel = yesNoMap[app.previousMember] || app.previousMember || '-';
        const councilLabel = yesNoMap[app.studentCouncil] || app.studentCouncil || '-';
        const otherClubLabel = yesNoMap[app.otherClub] || app.otherClub || '-';

        return `
                                <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-blue-200">
                                    <button type="button" onclick="toggleApplication(${app.id})" class="w-full flex items-center justify-between gap-3 p-4 text-left focus:outline-none">
                                        <div class="flex items-center gap-3 min-w-0">
                                            <span class="font-bold text-gray-800 text-base truncate">${app.name || app.username || '이름 없음'}</span>
                                            <span class="text-xs text-gray-800 shrink-0">${app.studentId || app.userId || '학번 미상'}</span>
                                            <span class="text-xs text-gray-800 shrink-0">${app.department || app.major || ''}${app.grade ? ' ' + app.grade + '학년' : ''}</span>
                                        </div>
                                        <div class="flex items-center gap-3 shrink-0">
                                            <span class="text-xs text-gray-400">${formatDate(app.submittedAt)}</span>
                                            <svg id="chevron-${app.id}" class="w-4 h-4 text-gray-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </button>
                                    <div id="detail-${app.id}" class="app-detail overflow-hidden transition-all duration-300 ease-in-out" style="max-height: 0px;">
                                        <div class="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/60">
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                                                <div><p class="text-xs text-gray-400 mb-1">성별</p><p class="text-sm font-medium text-gray-800">${genderLabel}</p></div>
                                                <div><p class="text-xs text-gray-400 mb-1">연락처</p><p class="text-sm font-medium text-gray-800">${app.phone || '-'}</p></div>
                                                <div><p class="text-xs text-gray-400 mb-1">이메일</p><p class="text-sm font-medium text-gray-800">${app.email || '-'}</p></div>
                                                <div><p class="text-xs text-gray-400 mb-1">프로그래밍 경험</p><p class="text-sm font-medium text-gray-800">${expLabel}</p></div>
                                                
                                                <!-- 💡 새로 추가된 4가지 정보 -->
                                                <div><p class="text-xs text-gray-400 mb-1">이전 유비컴 가입 이력</p><p class="text-sm font-medium text-gray-800">${prevMemberLabel}</p></div>
                                                <div><p class="text-xs text-gray-400 mb-1">학생회 가입(예정) 여부</p><p class="text-sm font-medium text-gray-800">${councilLabel}</p></div>
                                                <div><p class="text-xs text-gray-400 mb-1">타 과동아리 가입(예정) 여부</p><p class="text-sm font-medium text-gray-800">${otherClubLabel}</p></div>
                                                <div><p class="text-xs text-gray-400 mb-1">추천인</p><p class="text-sm font-medium text-gray-800">${app.referrer || '-'}</p></div>
                                            </div>
                                            
                                            <div class="mt-4"><p class="text-xs text-gray-400 mb-1">지원 동기</p><p class="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">${app.motivation || '-'}</p></div>
                                            ${app.extra ? `<div class="mt-3"><p class="text-xs text-gray-400 mb-1">추가 하고 싶은 말</p><p class="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">${app.extra}</p></div>` : ''}
                                            
                                            <!-- 수락 및 거절 버튼 영역 -->
                                            <div class="mt-5 pt-3 border-t border-gray-200 flex justify-end gap-2">
                                                <button type="button" onclick="acceptApplication(${app.id})" class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                                    수락
                                                </button>
                                                <button type="button" onclick="rejectApplication(${app.id})" class="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition-colors shadow-sm">
                                                    거절
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
    }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

function toggleApplication(id) {
    const detail = document.getElementById(`detail-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (!detail) return;
    const isOpen = detail.classList.contains('open');
    if (isOpen) {
        detail.style.maxHeight = '0px';
        detail.classList.remove('open');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    } else {
        detail.style.maxHeight = detail.scrollHeight + 'px';
        detail.classList.add('open');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
}

async function acceptApplication(id) {
    if (!confirm('이 신청을 수락하시겠습니까?')) {
        return;
    }

    const applications =
        JSON.parse(
            localStorage.getItem('applications') || '[]'
        );

    const appData =
        applications.find(app => app.id === id);

    if (!appData) {
        alert('신청서를 찾을 수 없습니다.');
        return;
    }

    /*
     * 수락 시 users 테이블에만 저장할 데이터
     *
     * 중요:
     * - password 없음
     * - members 테이블 저장 없음
     * - 회원가입 처리 없음
     */

    const approvedUser = {
        userId: Number(appData.studentId || appData.userId),
        name: appData.name || appData.username,
        gender: appData.gender,
        major: appData.department || appData.major,
        phone: appData.phone,
        email: appData.email,
        isApproved: true

    };

    try {

        const response = await fetch(
            '/api/admin/users/add',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(approvedUser)
            }
        );

        if (!response.ok) {

            throw new Error(
                '승인 명단 저장에 실패했습니다.'
            );

        }

        const result =
            await response.json();

        if (!result.success) {

            alert(
                result.message ||
                '승인 명단 등록에 실패했습니다.'
            );

            return;
        }

        /*
         * DB의 users 테이블 저장 성공 후에만
         * 신청서를 localStorage에서 삭제
         */

        completeAcceptance(
            id,
            approvedUser.name
        );

    } catch (error) {

        console.error(
            '승인 명단 저장 실패:',
            error
        );

        alert(
            '승인 처리 중 오류가 발생했습니다.\n' +
            'DB에 저장되지 않았으므로 신청서는 삭제되지 않았습니다.'
        );

    }
}

// (헬퍼 함수) 수락 완료 후 화면 리스트 갱신
function completeAcceptance(id, name) {
    let applications = JSON.parse(localStorage.getItem('applications') || '[]');
    applications = applications.filter(app => app.id !== id);
    localStorage.setItem('applications', JSON.stringify(applications));

    alert(`수락 완료!\n[${name}]님이 가입 승인 명단에 등록되었습니다.`);

    if (currentAppContainer) {
        renderApplicationList(currentAppContainer);
    }
}

// 거절 버튼 동작 함수 (localStorage 삭제 및 목록 업데이트)
function rejectApplication(id) {
    if (confirm('이 신청을 정말 거절하시겠습니까? 거절 시 신청 목록에서 삭제됩니다.')) {
        let applications = JSON.parse(localStorage.getItem('applications') || '[]');
        applications = applications.filter(app => app.id !== id);
        localStorage.setItem('applications', JSON.stringify(applications));

        // 목록 다시 그리해서 화면에서 삭제 처리
        if (currentAppContainer) {
            renderApplicationList(currentAppContainer);
        }
    }
}