package et.guzo.common;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaginationMeta(
    int page,
    int limit,
    long total,
    int totalPages,
    boolean hasNext,
    boolean hasPrev,
    Long unreadCount
) {
    public static PaginationMeta of(int page, int limit, long total) {
        return of(page, limit, total, null);
    }

    public static PaginationMeta of(int page, int limit, long total, Long unreadCount) {
        int totalPages = limit > 0 ? (int) Math.ceil((double) total / limit) : 0;
        return new PaginationMeta(page, limit, total, totalPages, page < totalPages, page > 1, unreadCount);
    }
}
