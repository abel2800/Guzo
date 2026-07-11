package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.PushDevice;
import et.guzo.security.SecurityUtil;
import et.guzo.service.PushTokenService;
import et.guzo.web.dto.PushTokenRegisterRequest;
import et.guzo.web.dto.PushTokenRemoveRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/push-tokens")
@RequiredArgsConstructor
public class PushTokenController {

    private final PushTokenService pushTokenService;

    @PostMapping
    public ApiResponse<PushDevice> register(@Valid @RequestBody PushTokenRegisterRequest body) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(pushTokenService.register(user.getId(), body), "Push token registered");
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@Valid @RequestBody PushTokenRemoveRequest body) {
        pushTokenService.remove(SecurityUtil.requireUser().getId(), body);
    }
}
