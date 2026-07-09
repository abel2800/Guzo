package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.FamilyMember;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.FamilyService;
import et.guzo.web.dto.FamilyLinkRequest;
import et.guzo.web.dto.FamilyMemberResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @GetMapping("/{ownerUserId}")
    public ApiResponse<List<FamilyMemberResponse>> list(@PathVariable String ownerUserId) {
        var user = SecurityUtil.requireUser();
        if (!user.getId().equals(ownerUserId) && !RoleChecker.isAdmin(user)) {
            throw et.guzo.common.ApiException.forbidden("Not allowed");
        }
        List<FamilyMemberResponse> items = familyService.listForOwner(ownerUserId).stream()
            .map(FamilyMemberResponse::from)
            .toList();
        return ApiResponse.ok(items);
    }

    @PostMapping("/link")
    public ApiResponse<FamilyMemberResponse> link(@Valid @RequestBody FamilyLinkRequest body) {
        var user = SecurityUtil.requireUser();
        if (!user.getId().equals(body.ownerUserId()) && !RoleChecker.isAdmin(user)) {
            throw et.guzo.common.ApiException.forbidden("Not allowed");
        }
        FamilyMember fm = familyService.link(body.ownerUserId(), body.memberUserId(), body.relation(), body.label());
        return ApiResponse.ok(FamilyMemberResponse.from(fm), "Family member linked");
    }
}
