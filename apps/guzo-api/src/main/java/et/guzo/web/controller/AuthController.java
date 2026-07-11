package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.security.SecurityUtil;
import et.guzo.service.AuthService;
import et.guzo.web.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<LoginResponse> register(@Valid @RequestBody RegisterRequest body, jakarta.servlet.http.HttpServletRequest req) {
        return ApiResponse.ok(authService.register(body, req.getHeader("User-Agent"), req.getRemoteAddr()), "Registered");
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest body, jakarta.servlet.http.HttpServletRequest req) {
        return ApiResponse.ok(authService.login(body, req.getHeader("User-Agent"), req.getRemoteAddr()), "Logged in");
    }

    @PostMapping("/refresh")
    public ApiResponse<RefreshResponse> refresh(@Valid @RequestBody RefreshRequest body, jakarta.servlet.http.HttpServletRequest req) {
        return ApiResponse.ok(authService.refresh(body.refreshToken(), req.getHeader("User-Agent"), req.getRemoteAddr()), "Token refreshed");
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody(required = false) RefreshRequest body) {
        if (body != null) authService.logout(body.refreshToken());
        return ApiResponse.ok(null, "Logged out");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequest body) {
        return ApiResponse.ok(authService.forgotPassword(body));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest body) {
        return ApiResponse.ok(authService.resetPassword(body));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileDto> me() {
        return ApiResponse.ok(authService.me(SecurityUtil.requireUser().getId()));
    }

    @PatchMapping("/me")
    public ApiResponse<UserProfileDto> updateProfile(@RequestBody UpdateProfileRequest body) {
        return ApiResponse.ok(authService.updateProfile(SecurityUtil.requireUser().getId(), body));
    }

    @PatchMapping("/me/location")
    public ApiResponse<UserProfileDto> updateLocation(@RequestBody UpdateLocationRequest body) {
        return ApiResponse.ok(authService.updateLocation(SecurityUtil.requireUser().getId(), body));
    }

    @PatchMapping("/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest body) {
        authService.changePassword(SecurityUtil.requireUser().getId(), body);
        return ApiResponse.ok(null, "Password updated");
    }

    @PostMapping("/me/avatar")
    public ApiResponse<UserProfileDto> uploadAvatar(@RequestParam("avatar") org.springframework.web.multipart.MultipartFile file) {
        return ApiResponse.ok(authService.uploadAvatar(SecurityUtil.requireUser().getId(), file), "Avatar updated");
    }
}
