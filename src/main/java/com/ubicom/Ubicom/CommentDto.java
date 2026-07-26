package com.ubicom.Ubicom;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CommentDto {
    private String content;
    private Integer userId;

    @JsonProperty("isAnonymous")
    private boolean isAnonymous;
}