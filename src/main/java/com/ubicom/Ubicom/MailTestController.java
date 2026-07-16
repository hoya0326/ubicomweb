package com.ubicom.Ubicom;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MailTestController {

    private final EmailService emailService;

    @PostMapping("/api/mail/test")
    public Map<String, Object> sendTestMail(
            @RequestParam String email
    ) {
        Map<String, Object> result = new HashMap<>();

        try {
            emailService.sendTestMail(email);
            result.put("success", true);
            result.put("message", "메일 전송 성공");
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "메일 전송 실패");
        }

        return result;
    }
}