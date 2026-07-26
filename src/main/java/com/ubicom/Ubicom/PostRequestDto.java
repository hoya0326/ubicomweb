package com.ubicom.Ubicom;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostRequestDto {
    private String title;
    private String content;
    private Integer userId; // 학번/회원 아이디 (Integer)
    private boolean isAnonymous;
}