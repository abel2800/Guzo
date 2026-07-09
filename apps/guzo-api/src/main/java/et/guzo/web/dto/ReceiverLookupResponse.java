package et.guzo.web.dto;

import et.guzo.service.ReceiverDetectionService;

public record ReceiverLookupResponse(
    boolean found, String userId, String guzoId, String firstName, String lastName, String phone, String matchedBy
) {
    public static ReceiverLookupResponse from(ReceiverDetectionService.ReceiverMatch m) {
        return new ReceiverLookupResponse(m.found(), m.userId(), m.guzoId(), m.firstName(), m.lastName(), m.phone(), m.matchedBy());
    }
}
