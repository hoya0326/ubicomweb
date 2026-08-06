package com.ubicom.Ubicom.Dto;

import com.ubicom.Ubicom.Entity.Schedule;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class ScheduleDto {

    @Getter
    @Setter
    public static class Request {
        private String title;
        private String description;
        private LocalDate startDate;
        private String startTime; // "HH:mm" 형태
        private LocalDate endDate;
        private String endTime;   // "HH:mm" 형태
        private String category;
        private String recurrence;
        private LocalDate recurrenceEnd;
    }

    @Getter
    @Setter
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private String startDate;
        private String startTime; // "HH:mm"
        private String endDate;
        private String endTime;   // "HH:mm"
        private String category;
        private String recurrence;
        private String recurrenceEnd;
        private List<String> exceptions;

        public static Response fromEntity(Schedule entity) {
            Response response = new Response();
            response.setId(entity.getId());
            response.setTitle(entity.getTitle());
            response.setDescription(entity.getDescription());
            response.setStartDate(entity.getStartDate().toString());
            response.setStartTime(entity.getStartTime() != null ? entity.getStartTime().toString() : null);
            response.setEndDate(entity.getEndDate().toString());
            response.setEndTime(entity.getEndTime() != null ? entity.getEndTime().toString() : null);
            response.setCategory(entity.getCategory());
            response.setRecurrence(entity.getRecurrence());
            response.setRecurrenceEnd(
                    entity.getRecurrenceEnd() != null ? entity.getRecurrenceEnd().toString() : "9999-12-31"
            );
            response.setExceptions(entity.getExceptions());
            return response;
        }
    }
}