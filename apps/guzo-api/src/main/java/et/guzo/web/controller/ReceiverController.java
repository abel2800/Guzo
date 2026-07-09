package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.service.ReceiverDetectionService;
import et.guzo.web.dto.ReceiverLookupResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/receivers")
@RequiredArgsConstructor
public class ReceiverController {

    private final ReceiverDetectionService receiverDetectionService;

    
    @GetMapping("/lookup")
    public ApiResponse<ReceiverLookupResponse> lookup(
        @RequestParam(required = false) String phone,
        @RequestParam(required = false) String guzoId
    ) {
        ReceiverDetectionService.ReceiverMatch match = receiverDetectionService.detect(phone, guzoId);
        return ApiResponse.ok(ReceiverLookupResponse.from(match));
    }
}
