package com.ubicom.Ubicom;

import lombok.Getter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";

    }
    @GetMapping("/profile")
    public String profile() {
        return "forward:/profile.html";
    }

    @GetMapping("/vote")
    public String vote() {
        return "forward:/poll.html";
    }

    @GetMapping("/notice")
    public String notice() {
        return "forward:/notice.html";
    }

    @GetMapping("/calendar")
    public String calendar() {
        return "forward:/calendar.html";
    }

    @GetMapping("/board")
    public String board() {
        return "forward:/board.html";
    }

    @GetMapping("/board_detail")
    public String board_detail() {
        return "forward:/board-detail.html";
    }

    @GetMapping("/apply")
    public String apply() {
        return "forward:/apply.html";
    }

    @GetMapping("/admin_members")
    public String admin_members() {
        return "forward:/admin-members.html";
    }


    @GetMapping("/test2")
    String test2() {
        var encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("qwer1234"));
        return "redirect:/list";
    }

}

