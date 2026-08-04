package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Entity.*;
import com.ubicom.Ubicom.Repository.NoticeRepository;
import com.ubicom.Ubicom.Repository.PollRepository;
import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Repository.NoticeReadRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeApiController {

    private final NoticeRepository noticeRepository;
    private final PollRepository pollRepository;
    private final MemberRepository memberRepository;
    private final NoticeReadRepository noticeReadRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // 익명 투표 마스킹 처리 헬퍼 메서드
    private Poll maskIfAnonymous(Poll poll, boolean isAdmin, String currentUserId) {
        if (poll != null) {
            Hibernate.initialize(poll.getOptions());
            Hibernate.initialize(poll.getVotes());

            if (poll.getVotes() != null) {
                for (Vote v : poll.getVotes()) {
                    Hibernate.initialize(v.getOptionIds());
                    if (!isAdmin && poll.isAnonymous()) {
                        if (currentUserId == null || !currentUserId.equals(v.getUserId())) {
                            v.setUserId(null);
                            v.setUserName("익명");
                        }
                    }
                }
            }
            entityManager.detach(poll);
        }
        return poll;
    }

    /**
     * 1. 공지사항 전체 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<Notice>> getAllNotices() {
        List<Notice> list = noticeRepository.findAll();
        return ResponseEntity.ok(list);
    }

    /**
     * 2. 공지사항 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<Notice> getNoticeById(@PathVariable Long id) {
        return noticeRepository.findById(id)
                .map(notice -> {
                    notice.incrementViews();
                    noticeRepository.save(notice);
                    return ResponseEntity.ok(notice);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * 2-1. 공지사항에 연결된 투표 조회
     */
    @GetMapping("/{id}/poll")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getNoticePoll(
            @PathVariable Long id,
            @RequestParam(value = "isAdmin", defaultValue = "false") boolean isAdmin,
            @RequestParam(value = "currentUserId", required = false) String currentUserId) {

        if (!noticeRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "존재하지 않는 공지사항입니다."));
        }

        Poll poll = pollRepository.findByNoticeId(id).orElse(null);
        if (poll == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "연결된 투표가 없습니다."));
        }

        maskIfAnonymous(poll, isAdmin, currentUserId);
        return ResponseEntity.ok(poll);
    }

    /**
     * 3. 공지사항 작성 (투표 데이터 연동 저장 포함)
     */
    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> createNotice(@RequestBody Map<String, Object> requestDto) {
        Map<String, Object> response = new HashMap<>();

        try {
            String title = requestDto.get("title") != null ? String.valueOf(requestDto.get("title")) : "제목 없음";
            String content = requestDto.get("content") != null ? String.valueOf(requestDto.get("content")) : "";

            String author = "관리자";
            if (requestDto.get("author") != null) {
                Object authorObj = requestDto.get("author");
                if (authorObj instanceof Map) {
                    Map<?, ?> authorMap = (Map<?, ?>) authorObj;
                    if (authorMap.containsKey("name") && authorMap.get("name") != null) {
                        author = String.valueOf(authorMap.get("name"));
                    } else if (authorMap.containsKey("username") && authorMap.get("username") != null) {
                        author = String.valueOf(authorMap.get("username"));
                    }
                } else {
                    author = String.valueOf(authorObj);
                }
            }

            Notice notice = new Notice();
            notice.setTitle(title);
            notice.setContent(content);
            notice.setAuthor(author);
            notice.setCreatedAt(LocalDateTime.now());
            notice.setViews(0);
            notice.setHasPoll(false);

            Notice savedNotice = noticeRepository.save(notice);

            Object hasPollObj = requestDto.get("hasPoll");
            boolean hasPoll = hasPollObj instanceof Boolean ? (Boolean) hasPollObj : false;

            if (hasPoll && requestDto.get("poll") != null) {
                Object pollObj = requestDto.get("poll");
                if (pollObj instanceof Map) {
                    Map<?, ?> pollMap = (Map<?, ?>) pollObj;

                    Poll poll = new Poll();
                    poll.setNoticeId(savedNotice.getId());
                    poll.setTitle(pollMap.get("title") != null ? String.valueOf(pollMap.get("title")) : title);
                    poll.setQuestion(pollMap.get("question") != null ? String.valueOf(pollMap.get("question")) : title);

                    if (pollMap.containsKey("isAnonymous")) {
                        Object anon = pollMap.get("isAnonymous");
                        poll.setAnonymous(anon instanceof Boolean ? (Boolean) anon : Boolean.parseBoolean(String.valueOf(anon)));
                    }
                    if (pollMap.containsKey("allowMultiple")) {
                        Object multi = pollMap.get("allowMultiple");
                        poll.setAllowMultiple(multi instanceof Boolean ? (Boolean) multi : Boolean.parseBoolean(String.valueOf(multi)));
                    }

                    if (pollMap.get("endsAt") != null && !String.valueOf(pollMap.get("endsAt")).isEmpty()) {
                        try {
                            poll.setEndsAt(LocalDateTime.parse(String.valueOf(pollMap.get("endsAt"))));
                        } catch (Exception ignored) {}
                    }

                    poll.setCreatedAt(LocalDateTime.now());
                    poll.setCreatedBy(author);

                    if (pollMap.get("options") instanceof List) {
                        List<?> rawOptions = (List<?>) pollMap.get("options");
                        for (Object optItem : rawOptions) {
                            if (optItem != null) {
                                String optText = "";
                                if (optItem instanceof Map) {
                                    Map<?, ?> optMap = (Map<?, ?>) optItem;
                                    Object textObj = optMap.get("text");
                                    optText = textObj != null ? String.valueOf(textObj) : "";
                                } else {
                                    optText = String.valueOf(optItem);
                                }

                                if (!optText.trim().isEmpty()) {
                                    PollOption opt = new PollOption();
                                    opt.setText(optText);
                                    opt.setPoll(poll);
                                    poll.getOptions().add(opt);
                                }
                            }
                        }
                    }

                    pollRepository.save(poll);

                    savedNotice.setHasPoll(true);
                    noticeRepository.save(savedNotice);
                }
            }

            response.put("success", true);
            response.put("message", "공지사항과 투표가 성공적으로 등록되었습니다.");
            response.put("noticeId", savedNotice.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            System.err.println("❌ [NoticeApiController] 공지사항 작성 에러 발생:");
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "공지사항 등록 실패: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 3-1. 공지사항 수정
     */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateNotice(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestDto) {
        Map<String, Object> response = new HashMap<>();

        try {
            Notice notice = noticeRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. id=" + id));

            String title = requestDto.get("title") != null ? String.valueOf(requestDto.get("title")) : notice.getTitle();
            String content = requestDto.get("content") != null ? String.valueOf(requestDto.get("content")) : notice.getContent();

            notice.setTitle(title);
            notice.setContent(content);
            noticeRepository.save(notice);

            response.put("success", true);
            response.put("message", "공지사항이 성공적으로 수정되었습니다.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ [NoticeApiController] 공지사항 수정 에러 발생:");
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "공지사항 수정 실패: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 4. 공지사항 삭제
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        if (!noticeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        pollRepository.findByNoticeId(id).ifPresent(pollRepository::delete);

        noticeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 4-1. 공지사항 상단 고정(핀) 상태 변경
     */
    @PatchMapping("/{id}/pin")
    @Transactional
    public ResponseEntity<Map<String, Object>> togglePinNotice(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestDto) {

        Map<String, Object> response = new HashMap<>();

        try {
            Notice notice = noticeRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. id=" + id));

            Object isPinnedObj = requestDto.get("isPinned");
            boolean isPinned = isPinnedObj instanceof Boolean ? (Boolean) isPinnedObj : false;

            notice.setIsPinned(isPinned);
            noticeRepository.save(notice);

            response.put("success", true);
            response.put("message", isPinned ? "게시물이 상단에 고정되었습니다." : "고정이 해제되었습니다.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ [NoticeApiController] 공지 고정 상태 변경 에러:");
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "고정 상태 변경 실패: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 5. 특정 유저가 읽은 공지사항 ID 목록 조회 (기기 간 동기화용)
     */
    @GetMapping("/reads")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Long>> getReadNotices(@RequestParam("userId") String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<NoticeRead> reads = noticeReadRepository.findByUserId(userId);
        List<Long> readNoticeIds = reads.stream().map(NoticeRead::getNoticeId).toList();
        return ResponseEntity.ok(readNoticeIds);
    }

    /**
     * 6. 특정 공지사항을 읽음으로 처리
     */
    @PostMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Map<String, Object>> markNoticeAsRead(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestDto) {
        Map<String, Object> response = new HashMap<>();

        String userId = requestDto.get("userId") != null ? String.valueOf(requestDto.get("userId")) : null;
        if (userId == null || userId.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "사용자 ID가 필요합니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (!noticeRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "존재하지 않는 공지사항입니다.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        if (!noticeReadRepository.existsByUserIdAndNoticeId(userId, id)) {
            NoticeRead noticeRead = new NoticeRead(userId, id);
            noticeReadRepository.save(noticeRead);
        }

        response.put("success", true);
        response.put("message", "읽음 처리되었습니다.");
        return ResponseEntity.ok(response);
    }
}