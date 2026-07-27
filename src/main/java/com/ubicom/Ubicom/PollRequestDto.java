package com.ubicom.Ubicom;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class PollRequestDto {
    private String title;
    private String question;

    @JsonProperty("isAnonymous")
    private boolean anonymous; // 👈 매핑 오류 방지

    private boolean allowMultiple;
    private LocalDateTime endsAt;

    private List<OptionDto> options;

    @Getter
    @Setter
    public static class OptionDto {
        private String text;
    }
}