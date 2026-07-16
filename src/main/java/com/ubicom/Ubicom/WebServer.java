import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class WebServer {

    // 정적 파일들이 모여있는 프로젝트 기본 static 경로
    private static final String STATIC_DIR = "src/main/resources/static";

    public static void main(String[] args) throws IOException {
        // 포트를 8080으로 고정 설정
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        System.out.println("=================================================");
        System.out.println("  UbiCOM 웹 서버가 포트 " + port + "에서 실행되었습니다.");
        System.out.println("  주소: http://localhost:" + port + " 로 접속하세요.");
        System.out.println("=================================================");

        server.createContext("/", new FileServerHandler());     // HTML, CSS, JS 파일 연동 핸들러
        server.createContext("/submit", new SubmitHandler());   // 설문 데이터 연동 핸들러

        server.setExecutor(null);
        server.start();
    }

    // 실제 프로젝트 폴더의 정적 자원들을 제공하는 핸들러
    static class FileServerHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }

            path = path.replace("..", "");
            File file = new File(STATIC_DIR, path);

            if (file.exists() && !file.isDirectory()) {
                String contentType = "text/html; charset=UTF-8";
                if (path.endsWith(".css")) {
                    contentType = "text/css; charset=UTF-8";
                } else if (path.endsWith(".js")) {
                    contentType = "application/javascript; charset=UTF-8";
                }

                byte[] fileBytes = new byte[(int) file.length()];
                try (FileInputStream fis = new FileInputStream(file)) {
                    fis.read(fileBytes);
                }

                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, fileBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(fileBytes);
                }
            } else {
                String response = "<h1>404 Not Found</h1><p>파일이 없습니다: " + path + "</p>";
                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
                exchange.sendResponseHeaders(404, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            }
        }
    }

    // 신규 가입 설문 데이터 제출 처리 핸들러
    static class SubmitHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                byte[] bodyBytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bodyBytes, StandardCharsets.UTF_8);
                Map<String, String> params = parseFormData(body);

                String userName = params.getOrDefault("name", "미입력");
                String studentId = params.getOrDefault("userid", "미입력");
                String major = params.getOrDefault("major", "미입력");
                String userEmail = params.getOrDefault("email", "미입력");
                String interest = params.getOrDefault("interest", "미입력");
                String joinReason = params.getOrDefault("joinReason", "미입력");

                // 인텔리제이 Run(실행) 콘솔창에 신규회원 정보 기록 출력
                System.out.println("\n=================================");
                System.out.println("   📢 [UbiCOM 2학기 신규 가입서 접수!]");
                System.out.println("=================================");
                System.out.println("• 이름      : " + userName);
                System.out.println("• 학번      : " + studentId);
                System.out.println("• 학과      : " + major);
                System.out.println("• 이메일    : " + userEmail);
                System.out.println("• 관심 분야  : " + interest);
                System.out.println("• 지원 동기  : " + joinReason);
                System.out.println("=================================\n");

                // 제출 완료 페이지
                String response = "<!DOCTYPE html>" +
                        "<html lang='ko'>" +
                        "<head>" +
                        "    <meta charset='UTF-8'>" +
                        "    <title>제출 완료 - UbiCOM</title>" +
                        "    <style>" +
                        "        body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #191a1c; margin: 0; color: #bcbec4; }" +
                        "        .box { text-align: center; background: #2b2b2b; padding: 40px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); max-width: 450px; border: 1px solid #3c3f41; }" +
                        "        h2 { color: #10b981; margin-bottom: 10px; }" +
                        "        p { font-size: 15px; color: #a9b7c6; line-height: 1.6; }" +
                        "        .btn { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; transition: background 0.3s; }" +
                        "        .btn:hover { background-color: #059669; }" +
                        "    </style>" +
                        "</head>" +
                        "<body>" +
                        "    <div class='box'>" +
                        "        <h2>🎉 신청 완료!</h2>" +
                        "        <p><strong>" + userName + "</strong> 님의 가입 설문이 정상 제출되었습니다.<br>검토 후 개별적으로 회장단에서 연락드리겠습니다.</p>" +
                        "        <a href='/' class='btn'>홈페이지로 돌아가기</a>" +
                        "    </div>" +
                        "</body>" +
                        "</html>";

                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.getResponseHeaders().set("Location", "/");
                exchange.sendResponseHeaders(302, -1);
            }
        }
    }

    private static Map<String, String> parseFormData(String formData) {
        Map<String, String> map = new HashMap<>();
        String[] pairs = formData.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2) {
                String key = URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8);
                String value = URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8);
                map.put(key, value);
            } else if (keyValue.length == 1) {
                String key = URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8);
                map.put(key, "");
            }
        }
        return map;
    }
}