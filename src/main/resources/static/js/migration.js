// migration.js (페이지 로드시 메인 스크립트 전 또는 공통 영역에서 실행)

async function syncLocalStorageToDatabase() {
    const localPosts = JSON.parse(localStorage.getItem('posts') || '[]');
    const localComments = JSON.parse(localStorage.getItem('comments') || '[]');

    // 마이그레이션할 데이터가 없으면 즉시 종료
    if (localPosts.length === 0 && localComments.length === 0) {
        return;
    }

    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser) {
        console.warn('마이그레이션을 진행하려면 로그인이 필요합니다.');
        return;
    }

    // 서버 DTO 형식에 맞춰 페이로드 구성
    const payload = {
        userId: currentUser.id || currentUser.studentId || currentUser.username,
        posts: localPosts.map(post => ({
            title: post.title,
            content: post.content,
            isAnonymous: post.isAnonymous || false,
            views: post.views || 0,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        })),
        comments: localComments.map(comment => ({
            postId: comment.postId,
            content: comment.content,
            isAnonymous: comment.isAnonymous || false,
            createdAt: comment.createdAt
        }))
    };

    try {
        const response = await fetch('/api/migration/sync-localstorage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('로컬스토리지 데이터가 성공적으로 DB로 이관되었습니다.');

            // 동기화 성공 시 localData 삭제
            localStorage.removeItem('posts');
            localStorage.removeItem('comments');

            // 게시글 목록 재로딩 (loadPosts 함수가 존재하는 경우)
            if (typeof loadPosts === 'function') {
                loadPosts();
            }
        } else {
            console.error('데이터 마이그레이션 실패:', await response.text());
        }
    } catch (error) {
        console.error('마이그레이션 요청 중 오류 발생:', error);
    }
}

// DOM 준비 완료 시 마이그레이션 시도
document.addEventListener('DOMContentLoaded', () => {
    syncLocalStorageToDatabase();
});