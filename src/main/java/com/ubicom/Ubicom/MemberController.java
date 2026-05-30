package com.ubicom.Ubicom;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class MemberController {
    @GetMapping("/register")
    public String register() {
        return "forward:/register.html";
    }

    private final MemberRepository memberRepository;
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    @PostMapping("/member")
    public String addMember(
            String name,
            Integer userid,
            String major,
            String password

    ) throws Exception {
        var result = usersRepository.findByUserId(userid);
        var result2 = memberRepository.findByUserId(userid);
        if (result.isPresent()){
        }
        else{
            throw new Exception("존재하지 않는 학번입니다.");
        }
        if (result2.isPresent()){
            throw new Exception("등록된 학번입니다");
        }
        if ((int)(Math.log10(userid)+1) != 8){
            throw new Exception("8자를 입력하시오");
        }
        Member member = new Member();
        member.setName(name);
        member.setUserId(userid);
        member.setMajor(major);
        var hash = new BCryptPasswordEncoder().encode(password);
        member.setPassword(hash);

        memberRepository.save(member);

        return "redirect:/list";
    }
}