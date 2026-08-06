package com.ubicom.Ubicom.Controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
// 💡 아래 import가 핵심입니다!

import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.HashMap;
import java.util.Map;

@Controller
public class CustomErrorController implements ErrorController { // 💡 implements ErrorController 선언 필수

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String requestUri = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        // 1. API 요청(/api/...) 중 존재하지 않는 엔드포인트 접근 시 JSON 응답
        if (requestUri != null && requestUri.startsWith("/api/")) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "존재하지 않거나 삭제된 API 엔드포인트입니다.");

            int statusCode = status != null ? Integer.parseInt(status.toString()) : 404;
            return ResponseEntity.status(statusCode).body(errorResponse);
        }

        // 2. 일반 브라우저 페이지 요청 시 404 커스텀 HTML 페이지로 포워딩
        return "forward:/404.html";
    }
}