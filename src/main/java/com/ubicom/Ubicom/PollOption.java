package com.ubicom.Ubicom;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "poll_options")
public class PollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id")
    @JsonIgnore
    private Poll poll;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Poll getPoll() { return poll; }
    public void setPoll(Poll poll) { this.poll = poll; }
}