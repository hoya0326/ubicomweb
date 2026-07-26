package com.ubicom.Ubicom;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

public class ScheduleDto {

    @Getter
    @Setter
    public static class Request {
        private String title;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
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
        private String endDate;
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
            response.setEndDate(entity.getEndDate().toString());
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