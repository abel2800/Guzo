package et.guzo.util;

import et.guzo.common.PaginationMeta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;

public final class PageQuery {

    private PageQuery() {}

    public static Pageable of(int page, int limit) {
        return of(page, limit, "createdAt", Sort.Direction.DESC);
    }

    public static Pageable of(int page, int limit, String sortBy, Sort.Direction direction) {
        int p = Math.max(1, page);
        int l = Math.min(100, Math.max(1, limit));
        return PageRequest.of(p - 1, l, Sort.by(direction, sortBy));
    }

    public static Map<String, Object> pageResult(Page<?> page, int pageNum, int limit) {
        return Map.of(
            "items", page.getContent(),
            "meta", PaginationMeta.of(pageNum, limit, page.getTotalElements())
        );
    }
}
