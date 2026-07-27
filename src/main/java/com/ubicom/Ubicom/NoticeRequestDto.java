package com.ubicom.Ubicom;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class NoticeRequestDto {
    private String title;
    private String content;
    private Object author; // 문자열 또는 객체 호환용

    private boolean hasPoll; // 투표 포함 여부
    private PollDto poll;

    @Getter
    @Setter
    public static class PollDto {
        private String question;
        private List<String> options;
    }
}