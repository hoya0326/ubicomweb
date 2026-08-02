package com.ubicom.Ubicom;

import com.ubicom.Ubicom.Repository.MemberRepository;
import com.ubicom.Ubicom.Entity.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Integer userId;
        try {
            userId = Integer.parseInt(username);
        } catch (NumberFormatException e) {
            throw new UsernameNotFoundException("학번 형식이 올바르지 않습니다.");
        }

        var result = memberRepository.findByUserId(userId);
        if (result.isEmpty()) {
            throw new UsernameNotFoundException("가입이 되지 않은 학번입니다.");
        }

        Member user = result.get();

        return new User(
                String.valueOf(user.getUserId()),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}