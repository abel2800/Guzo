package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.service.OtpService;
import et.guzo.web.dto.OtpSendRequest;
import et.guzo.web.dto.OtpVerifyRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ApiResponse<Map<String, String>> send(@Valid @RequestBody OtpSendRequest body) {
        String phone = otpService.send(body.phone());
        return ApiResponse.ok(Map.of("phone", phone, "message", "OTP sent (check server logs in dev)"));
    }

    @PostMapping("/verify")
    public ApiResponse<Void> verify(@Valid @RequestBody OtpVerifyRequest body) {
        otpService.verify(body.phone(), body.code());
        return ApiResponse.ok(null, "Phone verified");
    }
}
