/**
 * apply.js
 * - 신규 회원 가입 지원서 제출 (DB 저장)
 * - 관리자 지원서 조회, 승인(Users 테이블 추가 API 연동), 거절 기능
 */

let currentAppContainer = null;

// ==========================================
// 1. 보안 및 유틸리티 함수
// ==========================================

/**
 * XSS 방지를 위한 HTML Escape 처리
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 에러 메시지 표시
function displayError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.classList.remove('hidden');
        const errorText = errorDiv.querySelector('p');
        if (errorText) {
            errorText.textContent = message;
        }
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert(message);
    }
}

// 에러 메시지 숨기기
function clearError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}


// ==========================================
// 2. PhoneInput 컴포넌트 유틸리티
// ==========================================
const PhoneInput = (() => {
    const MAX = [3, 4, 4];
    function getInputs(wrapId) {
        const wrap = document.getElementById(wrapId);
        return wrap ? Array.from(wrap.querySelectorAll("input[data-phone]")) : [];
    }
    function onInput(inputs, idx, e) {
        const raw = e.target.value.replace(/\D/g, "");
        e.target.value = raw.slice(0, MAX[idx]);
        if (e.target.value.length === MAX[idx] && idx < inputs.length - 1) {
            inputs[idx + 1].focus();
        }
    }
    function onKeydown(inputs, idx, e) {
        // 백스페이스 시 이전 입력창 이동 UX 개선
        if (e.key === "Backspace" && e.target.value === "" && idx > 0) {
            inputs[idx - 1].focus();
            return;
        }
        // 단축키(Ctrl+C, Ctrl+V, Cmd+V 등) 허용
        if (e.ctrlKey || e.metaKey) return;

        const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
        if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
    }
    function onPaste(inputs, idx, e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
        if (!text) return;
        let pos = 0;
        for (let i = 0; i < inputs.length && pos < text.length; i++) {
            const chunk = text.slice(pos, pos + MAX[i]);
            inputs[i].value = chunk;
            pos += chunk.length;
        }
        const lastFilled = inputs.reduce((acc, inp, i) => inp.value.length > 0 ? i : acc, 0);
        inputs[Math.min(lastFilled + 1, inputs.length - 1)].focus();
    }
    return {
        init(wrapId) {
            const inputs = getInputs(wrapId);
            inputs.forEach((inp, idx) => {
                inp.addEventListener("input", (e) => onInput(inputs, idx, e));
                inp.addEventListener("keydown", (e) => onKeydown(inputs, idx, e));
                inp.addEventListener("paste", (e) => onPaste(inputs, idx, e));
            });
        },
        getValue(wrapId) {
            return getInputs(wrapId).map((i) => i.value.trim()).join("-");
        },
        isEmpty(wrapId) {
            return getInputs(wrapId).every((i) => i.value.trim() === "");
        },
        setError(wrapId, on) {
            getInputs(wrapId).forEach((inp) => {
                inp.style.borderColor = on ? "#ef4444" : "";
                inp.style.boxShadow = on ? "0 0 0 2px #fee2e2" : "";
            });
        }
    };
})();


// ==========================================
// 3. DOM 로드 시 초기화
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. PhoneInput 초기화
    if (document.getElementById("applyPhoneWrap")) {
        PhoneInput.init("applyPhoneWrap");
    }

    // 2. 지원 동기 글자수 세기 기능
    const motivationField = document.getElementById('motivation');
    const motivationCount = document.getElementById('motivation-count');
    if (motivationField && motivationCount) {
        motivationField.addEventListener('input', function () {
            let len = this.value.length;
            if (len > 500) {
                this.value = this.value.substring(0, 500);
                len = 500;
            }
            motivationCount.textContent = len;
        });
    }

    // 3. 지원서 폼 제출 이벤트 바인딩
    const applyForm = document.getElementById('apply-form');
    if (applyForm) {
        applyForm.addEventListener('submit', handleApplySubmit);
    }
});


// ==========================================
// 4. 지원서 제출 처리 (백엔드 Apply 엔티티 연동)
// ==========================================
async function handleApplySubmit(e) {
    e.preventDefault();

    clearError();
    PhoneInput.setError("applyPhoneWrap", false);

    // Form 데이터 수집
    const name = document.getElementById('name') ? document.getElementById('name').value.trim() : '';
    const studentId = document.getElementById('studentId') ? document.getElementById('studentId').value.trim() : '';
    const department = document.getElementById('department') ? document.getElementById('department').value.trim() : '';
    const grade = document.getElementById('grade') ? document.getElementById('grade').value : '';
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const genderElement = document.querySelector('input[name="gender"]:checked');
    const experience = document.querySelector('input[name="experience"]:checked');
    const motivation = document.getElementById('motivation') ? document.getElementById('motivation').value.trim() : '';
    const previousMember = document.querySelector('input[name="previousMember"]:checked');
    const studentCouncil = document.querySelector('input[name="studentCouncil"]:checked');
    const otherClub = document.querySelector('input[name="otherClub"]:checked');
    const referrerInput = document.getElementById('referrer');
    const referrer = referrerInput ? referrerInput.value.trim() : '';
    const extraInput = document.getElementById('extra');
    const extra = extraInput ? extraInput.value.trim() : '';

    const phone = PhoneInput.getValue("applyPhoneWrap");

    // 유효성 검사
    if (!name) { displayError('이름을 입력해주세요.'); return; }
    if (!/^\d{8}$/.test(studentId)) { displayError('학번은 8자리 숫자로 입력해주세요.'); return; }
    if (!department) { displayError('학과를 선택해주세요.'); return; }
    if (!grade) { displayError('학년을 선택해주세요.'); return; }
    if (!genderElement) { displayError('성별을 선택해주세요.'); return; }

    if (PhoneInput.isEmpty("applyPhoneWrap")) {
        displayError('연락처를 입력해주세요.');
        PhoneInput.setError("applyPhoneWrap", true);
        return;
    }

    const phoneParts = phone.split('-');
    if (phoneParts.length !== 3 || phoneParts[0].length < 3 || phoneParts[1].length < 3 || phoneParts[2].length < 4) {
        displayError('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
        PhoneInput.setError("applyPhoneWrap", true);
        return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        displayError('올바른 이메일 형식이 아닙니다.');
        return;
    }

    if (!experience) { displayError('프로그래밍 경험 수준을 선택해주세요.'); return; }
    if (!motivation) { displayError('지원 동기를 작성해주세요.'); return; }
    if (motivation.length > 500) { displayError('지원 동기는 500자 이내로 작성해주세요.'); return; }
    if (!previousMember) { displayError('이전에 유비컴에 가입하셨었는지 선택해주세요.'); return; }
    if (!studentCouncil) { displayError('학생회 가입 여부를 선택해주세요.'); return; }
    if (!otherClub) { displayError('다른 IT대학 과동아리 가입 여부를 선택해주세요.'); return; }
    if (!referrer) { displayError('추천인을 입력해주세요.'); return; }

    // Spring Boot의 Apply 엔티티 구조와 맞춰 DTO 생성
    const applyPayload = {
        name,
        studentId,
        department,
        grade,
        gender: genderElement.value,
        phone,
        email,
        experience: experience.value,
        previousMember: previousMember.value,
        studentCouncil: studentCouncil.value,
        otherClub: otherClub.value,
        referrer,
        motivation,
        extra,
        status: 'pending'
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        if (submitBtn) submitBtn.disabled = true;

        const response = await fetch('/api/applies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(applyPayload)
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({}));
            throw new Error(errorResult.message || '지원서 제출 처리 중 오류가 발생했습니다.');
        }

        // 성공 UI 변경
        const formContainer = document.getElementById('form-container');
        const successContainer = document.getElementById('success-container');
        if (formContainer) formContainer.classList.add('hidden');
        if (successContainer) successContainer.classList.remove('hidden');

    } catch (error) {
        console.error('지원서 제출 실패:', error);
        displayError(error.message || '서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}


// ==========================================
// 5. 관리자 기능 (신청 목록, 승인 명단 등록, 거절)
// ==========================================

// 지원서 목록 조회 및 HTML 렌더링
async function renderApplicationList(container) {
    if (!container) return;
    currentAppContainer = container;

    try {
        const response = await fetch('/api/admin/applies?status=pending');
        if (!response.ok) throw new Error('지원서 목록을 불러오지 못했습니다.');

        const applications = await response.json();

        const formatDate = (dateString) => {
            if (!dateString) return '';
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
            const yesNoMap = { yes: '네', no: '아니오' };

            const expLabel = expMap[app.experience] || app.experience || '-';
            const genderLabel = genderMap[app.gender] || app.gender || '-';

            const prevMemberLabel = yesNoMap[app.previousMember] || app.previousMember || '-';
            const councilLabel = yesNoMap[app.studentCouncil] || app.studentCouncil || '-';
            const otherClubLabel = yesNoMap[app.otherClub] || app.otherClub || '-';

            return `
                                    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-blue-200">
                                        <button type="button" onclick="toggleApplication(${app.id})" class="w-full flex items-center justify-between gap-3 p-4 text-left focus:outline-none">
                                            <div class="flex items-center gap-3 min-w-0">
                                                <span class="font-bold text-gray-800 text-base truncate">${escapeHTML(app.name || '이름 없음')}</span>
                                                <span class="text-xs text-gray-800 shrink-0">${escapeHTML(app.studentId || '학번 미상')}</span>
                                                <span class="text-xs text-gray-800 shrink-0">${escapeHTML(app.department || '')}${app.grade ? ' ' + escapeHTML(app.grade) + '학년' : ''}</span>
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
                                                    <div><p class="text-xs text-gray-400 mb-1">성별</p><p class="text-sm font-medium text-gray-800">${escapeHTML(genderLabel)}</p></div>
                                                    <div><p class="text-xs text-gray-400 mb-1">연락처</p><p class="text-sm font-medium text-gray-800">${escapeHTML(app.phone || '-')}</p></div>
                                                    <div><p class="text-xs text-gray-400 mb-1">이메일</p><p class="text-sm font-medium text-gray-800">${escapeHTML(app.email || '-')}</p></div>
                                                    <div><p class="text-xs text-gray-400 mb-1">프로그래밍 경험</p><p class="text-sm font-medium text-gray-800">${escapeHTML(expLabel)}</p></div>
                                                    <div><p class="text-xs text-gray-400 mb-1">이전 유비컴 가입 이력</p><p class="text-sm font-medium text-gray-800">${escapeHTML(prevMemberLabel)}</p></div>
                                                    <div><p class="text-xs text-gray-400 mb-1">학생회 가입(예정) 여부</p><p class="text-sm font-medium text-gray-800">${escapeHTML(councilLabel)}</p></div>
                                                    <div><p class="text-xs text-gray-400 mb-1">타 과동아리 가입(예정) 여부</p><p class="text-sm font-medium text-gray-800">${escapeHTML(otherClubLabel)}</p></div>
                                                    <div><p class="text-xs text-gray-400 mb-1">추천인</p><p class="text-sm font-medium text-gray-800">${escapeHTML(app.referrer || '-')}</p></div>
                                                </div>
                                                
                                                <div class="mt-4"><p class="text-xs text-gray-400 mb-1">지원 동기</p><p class="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">${escapeHTML(app.motivation || '-')}</p></div>
                                                ${app.extra ? `<div class="mt-3"><p class="text-xs text-gray-400 mb-1">추가 하고 싶은 말</p><p class="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">${escapeHTML(app.extra)}</p></div>` : ''}
                                                
                                                <div class="mt-5 pt-3 border-t border-gray-200 flex justify-end gap-2">
                                                    <button type="button" onclick="acceptApplication(${app.id}, event)" class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                                        수락
                                                    </button>
                                                    <button type="button" onclick="rejectApplication(${app.id}, event)" class="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition-colors shadow-sm">
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
    } catch (error) {
        console.error('지원서 목록 조회 오류:', error);
        container.innerHTML = `<div class="p-6 text-center text-rose-500 font-medium">지원서 목록을 불러올 수 없습니다.</div>`;
    }
}

// 아코디언 열기/닫기
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
        detail.classList.add('open');
        detail.style.maxHeight = detail.scrollHeight + 'px';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
}

// 수락 처리 (UserApiController의 /api/admin/users/add 호출 및 지원서 상태 변경)
async function acceptApplication(id, event) {
    if (!confirm('이 신청을 수락하고 가입 승인 명단에 추가하시겠습니까?')) return;

    const btn = event ? event.currentTarget : null;
    if (btn) btn.disabled = true;

    try {
        // 1. 해당 신청서 정보 조회를 위한 단건 API 또는 전체 목록에서 추출
        // (안전하게 해당 지원서 항목의 정보를 DOM/데이터로 확보)
        const responseList = await fetch('/api/admin/applies?status=pending');
        const applications = await responseList.json();
        const appData = applications.find(a => a.id === id);

        if (!appData) {
            alert('해당 신청 정보를 찾을 수 없습니다.');
            return;
        }

        // 2. UserApiController의 /api/admin/users/add 가 요구하는 Users 엔티티 규격
        const approvedUserPayload = {
            userId: Number(appData.studentId),
            name: appData.name,
            gender: appData.gender,
            major: appData.department,
            phone: appData.phone,
            email: appData.email,
            isApproved: true
        };

        // 3. 승인 회원 테이블 추가 API 호출
        const addUserRes = await fetch('/api/admin/users/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(approvedUserPayload)
        });

        const addUserResult = await addUserRes.json();

        if (!addUserRes.ok || !addUserResult.success) {
            alert(addUserResult.message || '승인 명단 등록에 실패했습니다.');
            return;
        }

        // 4. 지원서 상태 변경 (status -> accepted) API 호출
        const acceptRes = await fetch(`/api/admin/applies/${id}/accept`, {
            method: 'POST'
        });

        if (!acceptRes.ok) {
            throw new Error('지원서 상태 변경에 실패했습니다.');
        }

        alert(`[${appData.name}] 님이 가입 승인 명단에 등록되었습니다.`);

        // 5. UI 목록 새로고침
        if (currentAppContainer) {
            renderApplicationList(currentAppContainer);
        }

    } catch (error) {
        console.error('승인 처리 실패:', error);
        alert(error.message || '수락 처리 중 오류가 발생했습니다.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// 거절 처리 (지원서 상태 변경 status -> rejected)
async function rejectApplication(id, event) {
    if (!confirm('이 신청을 vraiment 거절하시겠습니까?')) return;

    const btn = event ? event.currentTarget : null;
    if (btn) btn.disabled = true;

    try {
        const response = await fetch(`/api/admin/applies/${id}/reject`, {
            method: 'POST'
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.message || '거절 처리 실패');
        }

        alert('신청이 거절되었습니다.');

        if (currentAppContainer) {
            renderApplicationList(currentAppContainer);
        }

    } catch (error) {
        console.error('거절 처리 실패:', error);
        alert(error.message || '거절 처리 중 오류가 발생했습니다.');
    } finally {
        if (btn) btn.disabled = false;
    }
}