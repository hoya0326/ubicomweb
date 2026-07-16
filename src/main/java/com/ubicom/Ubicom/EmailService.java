package com.ubicom.Ubicom;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendTemporaryPassword(String to, String temporaryPassword) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("[UbiCOM] 임시 비밀번호 발급");
        message.setText(
                "안녕하세요. UbiCOM입니다.\n\n" +
                        "요청하신 임시 비밀번호가 발급되었습니다.\n" +
                        "임시 비밀번호: " + temporaryPassword + "\n\n" +
                        "임시 비밀번호로 로그인한 뒤 회원정보 페이지에서 반드시 새 비밀번호로 변경해주세요.\n" +
                        "본인이 요청하지 않은 경우 관리자에게 문의해주세요.\n\n" +
                        "감사합니다.\n" +
                        "UbiCOM 드림"
        );

        mailSender.send(message);
    }

}