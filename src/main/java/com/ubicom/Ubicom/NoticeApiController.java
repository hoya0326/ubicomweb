package com.ubicom.Ubicom;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeApiController {

    private final NoticeRepository noticeRepository;

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
     * 3. 공지사항 작성 (500 방지 안전 로직)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createNotice(@RequestBody Map<String, Object> requestDto) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 1. 제목(title)
            String title = requestDto.get("title") != null ? String.valueOf(requestDto.get("title")) : "제목 없음";

            // 2. 내용(content)
            String content = requestDto.get("content") != null ? String.valueOf(requestDto.get("content")) : "";

            // 3. 작성자(author) - 문자열 또는 객체 형태 호환
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

            // 4. 엔티티 생성 및 DB 저장
            Notice notice = new Notice();
            notice.setTitle(title);
            notice.setContent(content);
            notice.setAuthor(author);
            notice.setCreatedAt(LocalDateTime.now());
            notice.setViews(0); // views / view_count 명시적 0 초기화

            Notice savedNotice = noticeRepository.save(notice);

            response.put("success", true);
            response.put("message", "공지사항이 성공적으로 등록되었습니다.");
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
     * 4. 공지사항 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        if (!noticeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        noticeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}