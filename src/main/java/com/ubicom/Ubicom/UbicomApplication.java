package com.ubicom.Ubicom;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class UbicomApplication {
	@PostConstruct
	public void init() {
		// 서버의 기본 타임존을 한국 시간(KST)으로 고정하여 마감기한 시간 오차 해결
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
	}

	public static void main(String[] args) {

		SpringApplication.run(UbicomApplication.class, args);
	}

}

