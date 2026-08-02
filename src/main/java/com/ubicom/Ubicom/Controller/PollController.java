package com.ubicom.Ubicom.Controller;

import com.ubicom.Ubicom.Dto.PollRequestDto;
import com.ubicom.Ubicom.Dto.VoteRequestDto;
import com.ubicom.Ubicom.Repository.PollRepository;
import com.ubicom.Ubicom.Repository.VoteRepository;
import com.ubicom.Ubicom.Entity.Poll;
import com.ubicom.Ubicom.Entity.PollOption;
import com.ubicom.Ubicom.Entity.Vote;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpSession;
import org.hibernate.Hibernate;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/polls")
public class PollController {

    private final PollRepository pollRepository;
    private final VoteRepository voteRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public PollController(PollRepository pollRepository, VoteRepository voteRepository) {
        this.pollRepository = pollRepository;
        this.voteRepository = voteRepository;
    }

    // 마스킹 처리 로직 (관리자이거나 본인 투표인 경우 정보 유지, 타인의 익명 투표는 마스킹)
    private Poll maskIfAnonymous(Poll poll, boolean isAdmin, String currentUserId) {
        if (poll != null) {
            Hibernate.initialize(poll.getOptions());
            Hibernate.initialize(poll.getVotes());

            if (poll.getVotes() != null) {
                for (Vote v : poll.getVotes()) {
                    Hibernate.initialize(v.getOptionIds());
                    // 관리자가 아니고, 익명 투표인 경우
                    if (!isAdmin && poll.isAnonymous()) {
                        // 현재 조회하는 유저의 투표가 아니라면 마스킹 처리 (본인 투표는 유지하여 새로고침 시 참여 완료 상태 유지)
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

    // 1. 투표 목록 조회
    @GetMapping
    @Transactional(readOnly = true)
    public List<Poll> getAllPolls(
            @RequestParam(value = "isAdmin", defaultValue = "false") boolean isAdmin,
            @RequestParam(value = "currentUserId", required = false) String currentUserId) {
        List<Poll> polls = pollRepository.findAll();
        for (Poll poll : polls) {
            maskIfAnonymous(poll, isAdmin, currentUserId);
        }
        return polls;
    }

    // 1-1. 관리자용 투표 목록 조회
    @GetMapping("/admin")
    @Transactional(readOnly = true)
    public List<Poll> getAllPollsForAdmin() {
        List<Poll> polls = pollRepository.findAll();
        for (Poll poll : polls) {
            maskIfAnonymous(poll, true, null);
        }
        return polls;
    }

    // 1-2. 특정 투표 단건 상세 조회
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPollById(
            @PathVariable Long id,
            @RequestParam(value = "isAdmin", defaultValue = "false") boolean isAdmin,
            @RequestParam(value = "currentUserId", required = false) String currentUserId) {
        Poll poll = pollRepository.findById(id).orElse(null);
        if (poll == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "존재하지 않는 투표입니다."));
        }
        maskIfAnonymous(poll, isAdmin, currentUserId);
        return ResponseEntity.ok(poll);
    }

    // 2. 새 투표 생성
    @PostMapping
    public ResponseEntity<?> createPoll(@RequestBody PollRequestDto pollRequest, HttpSession session) {
        Poll poll = new Poll();
        poll.setNoticeId(pollRequest.getNoticeId());
        poll.setTitle(pollRequest.getTitle());
        poll.setQuestion(pollRequest.getQuestion());
        poll.setAnonymous(pollRequest.isAnonymous());
        poll.setAllowMultiple(pollRequest.isAllowMultiple());
        poll.setEndsAt(pollRequest.getEndsAt());
        poll.setCreatedAt(LocalDateTime.now());
        poll.setCreatedBy("관리자");

        if (pollRequest.getOptions() != null) {
            for (PollRequestDto.OptionDto optDto : pollRequest.getOptions()) {
                PollOption opt = new PollOption();
                opt.setText(optDto.getText());
                opt.setPoll(poll);
                poll.getOptions().add(opt);
            }
        }

        Poll saved = pollRepository.save(poll);
        return ResponseEntity.ok(saved);
    }

    // 3. 투표하기 (직접 삭제 쿼리를 통해 중복 데이터 누적 원천 차단)
    @PostMapping("/{id}/vote")
    @Transactional
    public ResponseEntity<?> castVote(@PathVariable Long id, @RequestBody VoteRequestDto voteRequest) {
        Poll poll = pollRepository.findById(id).orElse(null);
        if (poll == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "존재하지 않는 투표입니다."));
        }

        if (poll.getEndsAt() != null && poll.getEndsAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "이미 마감된 투표입니다."));
        }

        if (voteRequest.getUserId() == null || voteRequest.getUserId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "사용자 ID가 없습니다. 로그인 상태를 확인해주세요."));
        }

        // 기존 투표 기록 삭제 후 즉시 반영
        voteRepository.deleteByPollIdAndUserId(id, voteRequest.getUserId());
        voteRepository.flush();

        // 새로운 투표 저장
        Vote vote = new Vote();
        vote.setPoll(poll);
        vote.setUserId(voteRequest.getUserId());
        vote.setUserName(voteRequest.getUserName());

        if (voteRequest.getOptionIds() != null) {
            vote.getOptionIds().addAll(voteRequest.getOptionIds());
        }

        voteRepository.save(vote);
        voteRepository.flush();

        Poll updatedPoll = pollRepository.findById(id).get();
        return ResponseEntity.ok(maskIfAnonymous(updatedPoll, false, voteRequest.getUserId()));
    }

    // 4. 투표 마감 처리 (관리자용)
    @PatchMapping("/{id}/close")
    public ResponseEntity<?> closePoll(@PathVariable Long id) {
        Poll poll = pollRepository.findById(id).orElse(null);
        if (poll == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "존재하지 않는 투표입니다."));
        }
        poll.setEndsAt(LocalDateTime.now());
        pollRepository.save(poll);
        return ResponseEntity.ok(Map.of("message", "투표가 마감되었습니다."));
    }

    // 5. 투표 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePoll(@PathVariable Long id) {
        if (!pollRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "존재하지 않는 투표입니다."));
        }
        pollRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }
}