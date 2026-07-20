// Home page functionality

// home.js 파일의 상단 부분 예시

document.addEventListener('DOMContentLoaded', function() {
    const mainContent = document.getElementById('main-content');

    // 1. 우선 로컬 캐시에 저장된 정보가 있다면 대시보드를 빠르게 렌더링 (깜빡임 방지)
    const cachedUser = getCurrentUser(); // 공통 스크립트의 함수 호출
    if (cachedUser) {
        showDashboard(mainContent, cachedUser);
    } else {
        showLandingPage(mainContent);
    }

    // 2. [핵심] 공통 스크립트가 서버 인증 검증을 마친 시점('authVerified')을 구독합니다.
    window.addEventListener('authVerified', function(e) {
        const verifiedUser = e.detail; // 서버가 보낸 진짜 세션 유저 정보

        if (verifiedUser) {
            // 검증된 유저 정보로 홈 대시보드 확정 및 갱신
            showDashboard(mainContent, verifiedUser);
        } else {
            // 세션이 없거나 만료된 상태라면 방문자 페이지 확정
            showLandingPage(mainContent);
        }
    });
});

function showLandingPage(container) {
    container.innerHTML = `
        <section class="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20"> 
            <div class="container mx-auto px-4 text-center"> 
                <h1 class="text-5xl md:text-6xl font-bold mb-6">UbiCOM에 오신 것을 환영합니다</h1> 
                <p class="text-xl md:text-2xl mb-8 text-blue-100"> 
                    Ubiquitous Computing - 유비쿼터스 컴퓨팅 동아리 
                </p> 
                <p class="text-lg mb-10 max-w-2xl mx-auto text-blue-50"> 
                    함께 배우고, 만들고, 성장하는 컴퓨팅 동아리입니다.  
                    최신 기술을 탐구하고 실전 프로젝트를 통해 미래의 개발자로 성장해보세요. 
                </p> 
                <div class="flex flex-col sm:flex-row gap-4 justify-center"> 
                    <a onclick="location.href='/apply'" class="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-md font-medium transition-colors"> 
                        2학기 신규회원 가입신청 
                    </a> 
                </div> 
            </div> 
        </section> 
 
        <section class="py-16 bg-gray-50"> 
            <div class="container mx-auto px-4"> 
                <h2 class="text-4xl font-bold text-center mb-12">우리의 활동</h2> 
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> 
                    <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-center"> 
                        <div class="flex justify-center mb-4"> 
                            <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path> 
                            </svg> 
                        </div> 
                        <h3 class="text-xl font-bold mb-2">기술 학습</h3> 
                        <p class="text-gray-600">최신 컴퓨팅 기술과 프로그래밍을 함께 배우고 성장합니다.</p> 
                    </div> 
                    <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-center"> 
                        <div class="flex justify-center mb-4"> 
                            <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path> 
                            </svg> 
                        </div> 
                        <h3 class="text-xl font-bold mb-2">협업 프로젝트</h3> 
                        <p class="text-gray-600">팀 프로젝트를 통해 실무 경험을 쌓고 협업 능력을 키웁니다.</p> 
                    </div> 
                    <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-center"> 
                        <div class="flex justify-center mb-4"> 
                            <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path> 
                            </svg> 
                        </div> 
                        <h3 class="text-xl font-bold mb-2">아이디어 공유</h3> 
                        <p class="text-gray-600">창의적인 아이디어를 공유하고 함께 발전시켜 나갑니다.</p> 
                    </div> 
                    <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-center"> 
                        <div class="flex justify-center mb-4"> 
                            <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path> 
                            </svg> 
                        </div> 
                        <h3 class="text-xl font-bold mb-2">정기 스터디</h3> 
                        <p class="text-gray-600">정기적인 스터디를 통해 지식을 키웁니다.</p> 
                    </div> 
                </div> 
            </div> 
        </section> 
 
         
 
        <section class="py-16 bg-blue-600 text-white"> 
            <div class="container mx-auto px-4 text-center"> 
                <h2 class="text-3xl md:text-4xl font-bold mb-6">지금 바로 시작하세요!</h2> 
                <p class="text-xl mb-8 text-blue-100"> 
                    UbiCOM과 함께 성장하는 개발자가 되어보세요 
                </p> 
                <a onclick="location.href='/apply'" class="inline-block bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-md font-medium transition-colors"> 
                    2학기 신규회원 가입신청 
                </a> 
            </div> 
        </section> 
    `;
}

function showDashboard(container, user) {
    if (!container) return;

    // 로컬 스토리지 데이터 바인딩
    const recentNotices = JSON.parse(localStorage.getItem('notices') || '[]').slice(0, 5);
    const recentPosts = JSON.parse(localStorage.getItem('posts') || '[]').slice(0, 5);

    // [확인 완료] 로컬 스토리지에 'applications'가 없으면 빈 배열로 시작
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');

    // 💡 [수정] 스크린샷의 데이터 구조 반영: user.isAdmin이 true인지 검사합니다.
    const isAdmin = user && (user.isAdmin === true || user.role === 'ADMIN' || user.role === 'admin');

    // 날짜 포맷 헬퍼 함수
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    container.innerHTML = `
        <div class="min-h-[calc(100vh-16rem)] py-8 px-4 bg-gray-50"> 
            <div class="container mx-auto max-w-6xl"> 
                <!-- 상단 웰컴 배너 (username, department 반영) --> 
                <div class="mb-8"> 
                    <h1 class="text-4xl font-bold mb-2">${user.username || user.name || '회원'}님, 환영합니다!</h1> 
                    <p class="text-gray-600">UbiCOM 커뮤니티에서 활발히 활동해보세요</p> 
                </div> 
 
                 
 
                <!-- 대시보드 통계 카드 그리드 --> 
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> 
                    <div class="bg-white rounded-lg shadow p-6"> 
                        <div class="flex items-center justify-between"> 
                            <div> 
                                <p class="text-sm text-gray-600 mb-1">공지사항</p> 
                                <p class="text-2xl font-bold">${recentNotices.length}</p> 
                            </div> 
                            <div class="bg-blue-100 rounded-full p-3"> 
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path> 
                                </svg> 
                            </div> 
                        </div> 
                    </div> 
                    <div class="bg-white rounded-lg shadow p-6"> 
                        <div class="flex items-center justify-between"> 
                            <div> 
                                <p class="text-sm text-gray-600 mb-1">전체 게시글</p> 
                                <p class="text-2xl font-bold">${recentPosts.length}</p> 
                            </div> 
                            <div class="bg-green-100 rounded-full p-3"> 
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path> 
                                </svg> 
                            </div> 
                        </div> 
                    </div> 
                    <div class="bg-white rounded-lg shadow p-6"> 
                        <div class="flex items-center justify-between"> 
                            <div> 
                                <p class="text-sm text-gray-600 mb-1">학과</p> 
                                <p class="text-xl font-bold text-gray-900">${user.department || user.major || '미지정'}</p> 
                            </div> 
                            <div class="bg-purple-100 rounded-full p-3"> 
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path> 
                                </svg> 
                            </div> 
                        </div> 
                    </div> 
                </div> 
 
                <!-- 하단 주요 섹션 그리드 --> 
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                    <div class="bg-white rounded-lg shadow p-6"> 
                        <h2 class="text-xl font-bold mb-4 text-gray-800">바로가기</h2> 
                        <div class="space-y-3"> 
                            <a href="notice.html" class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"> 
                                <span class="font-medium text-gray-700">공지사항</span> 
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> 
                                </svg> 
                            </a> 
                            <a href="board.html" class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"> 
                                <span class="font-medium text-gray-700">게시판</span> 
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> 
                                </svg> 
                            </a> 
                            <a href="calendar.html" class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"> 
                                <span class="font-medium text-gray-700">학사일정</span> 
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> 
                                </svg> 
                            </a> 
                        </div> 
                    </div> 
 
                    <div class="bg-white rounded-lg shadow p-6"> 
                        <h2 class="text-xl font-bold mb-4 text-gray-800">최근 공지사항</h2> 
                        <div class="space-y-3"> 
                            ${recentNotices.length > 0 ? recentNotices.map(notice => `
                                <a href="notice.html" class="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"> 
                                    <p class="font-medium text-gray-800 truncate">${notice.title}</p> 
                                    <p class="text-xs text-gray-400 mt-1">${formatDate(notice.createdAt || notice.date)}</p> 
                                </a> 
                            `).join('') : '<p class="text-gray-500 text-center py-8">등록된 공지사항이 없습니다.</p>'}
                        </div> 
                    </div> 
                     
                </div> 
                <!-- ================= [ADMIN ONLY] 가입 신청 현황 섹션 ================= --> 
                ${isAdmin ? `
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
        const interestMap = { web: '웹 개발', mobile: '모바일 앱', ai: 'AI / 머신러닝', iot: 'IoT / 임베디드', security: '보안', game: '게임 개발' };
        const expLabel = expMap[app.experience] || app.experience || '-';
        const interestLabel = (app.interests && app.interests.length)
            ? app.interests.map(i => interestMap[i] || i).join(', ')
            : '-';
        return `
                                        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-blue-200"> 
                                            <button type="button" onclick="toggleApplication(${app.id})" class="w-full flex items-center justify-between gap-3 p-4 text-left focus:outline-none"> 
                                                <div class="flex items-center gap-3 min-w-0"> 
<!--                                                    관리자 계정에서 2학기 신규회원 가입신청 현황 학번, 학과 학년 글자크기-->
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
                                                        <div> 
                                                            <p class="text-xs text-gray-400 mb-1">연락처</p> 
                                                            <p class="text-sm font-medium text-gray-800">${app.phone || '-'}</p> 
                                                        </div> 
                                                        <div> 
                                                            <p class="text-xs text-gray-400 mb-1">이메일</p> 
                                                            <p class="text-sm font-medium text-gray-800">${app.email || '-'}</p> 
                                                        </div> 
                                                        <div> 
                                                            <p class="text-xs text-gray-400 mb-1">프로그래밍 경험</p> 
                                                            <p class="text-sm font-medium text-gray-800">${expLabel}</p> 
                                                        </div> 
                                                        <div> 
                                                            <p class="text-xs text-gray-400 mb-1">관심 분야</p> 
                                                            <p class="text-sm font-medium text-gray-800">${interestLabel}</p> 
                                                        </div> 
                                                    </div> 
                                                    <div class="mt-4"> 
                                                        <p class="text-xs text-gray-400 mb-1">지원 동기</p> 
                                                        <p class="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">${app.motivation || '-'}</p> 
                                                    </div> 
                                                    ${app.extra ? `
                                                    <div class="mt-3"> 
                                                        <p class="text-xs text-gray-400 mb-1">추가 하고 싶은 말</p> 
                                                        <p class="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">${app.extra}</p> 
                                                    </div> 
                                                    ` : ''}
                                                </div> 
                                            </div> 
                                        </div> 
                                        `;
    }).join('')}
                                </div> 
                            `}
                        </div> 
                    </div> 
                ` : ''}
                <!-- ====================================================================== --> 
            </div> 
             
        </div> 
    `;
}

// 2학기 신규회원 가입 신청 카드 - 클릭 시 커튼처럼 펼쳐지는 아코디언 토글
function toggleApplication(id) {
    const detail = document.getElementById(`detail-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (!detail) return;

    const isOpen = detail.classList.contains('open');

    if (isOpen) {
        // 접기
        detail.style.maxHeight = '0px';
        detail.classList.remove('open');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    } else {
        // 펼치기 - 실제 콘텐츠 높이만큼 max-height를 지정해 부드럽게 애니메이션
        detail.style.maxHeight = detail.scrollHeight + 'px';
        detail.classList.add('open');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
}

// 혹시 스크립트 내부에 기존에 사용하던 안전한 날짜 변환 함수(formatDate)가 없다면 아래를 유지하거나 살려두세요.
function formatDate(dateString) {
    if(!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}