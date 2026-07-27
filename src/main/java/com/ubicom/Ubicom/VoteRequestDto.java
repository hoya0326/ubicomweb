package com.ubicom.Ubicom;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class VoteRequestDto {
    private String userId;
    private String userName;
    private List<Long> optionIds;
}