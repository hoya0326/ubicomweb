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
    @GetMapping("/test2")
    String test2() {
        var encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("qwer1234"));
        return "redirect:/list";
    }

}

