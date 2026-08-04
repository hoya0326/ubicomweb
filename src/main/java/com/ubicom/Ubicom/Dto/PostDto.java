package com.ubicom.Ubicom.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostDto {
    private String title;
    private String content;
    private Integer userId;

    // Jackson 변환 오류 방지용 명시적 처리
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    @JsonProperty("isSecret")
    private boolean isSecret;
}