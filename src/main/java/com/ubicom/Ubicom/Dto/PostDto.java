package com.ubicom.Ubicom.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostDto {

    private String title;
    private String content;

    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    @JsonProperty("isSecret")
    private boolean isSecret;

    @JsonProperty("isPinned")
    private boolean isPinned;
}