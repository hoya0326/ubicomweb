package com.ubicom.Ubicom;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendTestMail(String to) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("[UbiCOM] 메일 발송 테스트");
        message.setText("Gmail SMTP 연결 테스트 메일입니다.");

        mailSender.send(message);
    }
}