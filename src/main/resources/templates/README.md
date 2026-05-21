# UbiCOM 웹사이트 - Spring Boot용 정적 파일

이 폴더에는 UbiCOM 동아리 웹사이트의 HTML, CSS, JavaScript 파일들이 포함되어 있습니다.
Spring Boot 프로젝트에서 바로 사용할 수 있도록 순수 HTML/CSS/JS로 변환되었습니다.

## 📁 파일 구조

```
static/
├── index.html              # 홈페이지 (랜딩 페이지 / 대시보드)
├── login.html              # 로그인 페이지
├── register.html           # 회원가입 페이지
├── notice.html             # 공지사항 페이지
├── board.html              # 게시판 목록 페이지
├── board-detail.html       # 게시글 상세 페이지
├── calendar.html           # 학사일정 달력 페이지
├── css/
│   └── styles.css          # 커스텀 스타일
└── js/
    ├── auth.js             # 인증 관련 기능
    ├── main.js             # 공통 기능
    ├── home.js             # 홈페이지 기능
    ├── login.js            # 로그인 기능
    ├── register.js         # 회원가입 기능
    ├── notice.js           # 공지사항 기능
    ├── board.js            # 게시판 목록 기능
    ├── board-detail.js     # 게시글 상세 기능
    └── calendar.js         # 달력 기능
```

## 🚀 Spring Boot에서 사용하기

### 1. 파일 배치

이 `static` 폴더 전체를 Spring Boot 프로젝트의 다음 경로에 복사하세요:

```
src/main/resources/static/
```

### 2. Spring Boot 설정

`application.properties` 또는 `application.yml`에 다음 설정을 추가하세요:

```properties
# application.properties
spring.web.resources.static-locations=classpath:/static/
```

또는

```yaml
# application.yml
spring:
  web:
    resources:
      static-locations: classpath:/static/
```

### 3. 컨트롤러 설정 (선택사항)

기본적으로 정적 파일은 자동으로 제공되지만, 루트 경로를 index.html로 매핑하려면:

```java
@Controller
public class HomeController {
    
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}
```

### 4. 애플리케이션 실행

```bash
mvn spring-boot:run
```

또는

```bash
./gradlew bootRun
```

브라우저에서 `http://localhost:8080` 접속

## 🔑 기본 계정

### 관리자 계정 (자동 생성)
- **학번**: 20233244
- **비밀번호**: admin

관리자 계정으로 로그인하면:
- 공지사항 작성/삭제
- 학사일정 추가/삭제
- 익명 게시글의 실제 작성자 확인
- 모든 게시글 삭제 가능

## 📋 주요 기능

### 1. 인증
- ✅ 회원가입 (이름, 학번, 학과, 비밀번호)
- ✅ 로그인 (학번, 비밀번호)
- ✅ 로그아웃
- ✅ 로그인 상태 확인
- ✅ 관리자 권한 확인

### 2. 홈페이지
- ✅ 로그인 전: 랜딩 페이지 표시
- ✅ 로그인 후: 개인화된 대시보드 표시
- ✅ 동아리 소개 및 활동 안내

### 3. 공지사항
- ✅ 공지사항 목록 조회
- ✅ 공지사항 상세 조회
- ✅ 공지사항 작성 (관리자만)
- ✅ 공지사항 삭제 (관리자만)

### 4. 게시판
- ✅ 게시글 목록 조회
- ✅ 게시글 검색
- ✅ 게시글 작성 (익명 옵션 포함)
- ✅ 게시글 상세 조회
- ✅ 게시글 삭제 (작성자 또는 관리자)
- ✅ 댓글 작성/삭제
- ✅ 조회수 카운트
- ✅ 익명 게시 (관리자는 실제 작성자 확인 가능)

### 5. 학사일정
- ✅ 월별 달력 표시
- ✅ 일정 목록 조회
- ✅ 일정 추가 (관리자만)
- ✅ 일정 삭제 (관리자만)
- ✅ 이전/다음 달 이동

## 💾 데이터 저장

현재는 브라우저의 **localStorage**를 사용하여 데이터를 저장합니다.
실제 운영 환경에서는 Spring Boot 백엔드 API를 만들어 데이터베이스에 저장하는 것을 권장합니다.

### localStorage에 저장되는 데이터:
- `users` - 사용자 정보
- `currentUser` - 현재 로그인한 사용자
- `notices` - 공지사항
- `posts` - 게시글
- `comments` - 댓글
- `events` - 학사일정

## 🔧 백엔드 API 연동 (추후 작업)

JavaScript에서 localStorage 대신 백엔드 API를 호출하도록 수정하려면:

### 예시: 로그인 API 연동
```javascript
// 기존 코드 (localStorage)
function loginUser(studentId, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.studentId === studentId && u.password === password);
    // ...
}

// 백엔드 API 연동
async function loginUser(studentId, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId, password })
        });
        
        if (!response.ok) {
            throw new Error('로그인 실패');
        }
        
        const data = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

## 🎨 디자인

- **CSS 프레임워크**: Tailwind CSS (CDN)
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **아이콘**: SVG 아이콘 사용

## 📱 브라우저 호환성

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 🔒 보안 주의사항

⚠️ **중요**: 현재 코드는 데모/개발 목적으로 만들어졌습니다.

실제 운영 환경에서는 다음 사항을 반드시 개선해야 합니다:

1. **비밀번호 해싱**: 평문 비밀번호를 저장하지 말고 백엔드에서 bcrypt 등으로 해싱
2. **JWT 토큰**: 세션 관리를 위해 JWT 사용
3. **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS 사용
4. **XSS 방지**: 사용자 입력값 검증 및 이스케이프 처리 강화
5. **CSRF 방지**: Spring Security CSRF 토큰 사용
6. **SQL Injection 방지**: PreparedStatement 사용
7. **파일 업로드 검증**: 파일 업로드 기능 추가 시 검증 로직 필수

## 📝 라이선스

이 프로젝트는 UbiCOM 동아리 내부용으로 제작되었습니다.

## 👨‍💻 개발자 노트

추가 기능이나 버그 수정이 필요한 경우, 각 JavaScript 파일을 수정하세요.
모든 기능은 순수 JavaScript로 작성되어 있어 프레임워크 의존성이 없습니다.
