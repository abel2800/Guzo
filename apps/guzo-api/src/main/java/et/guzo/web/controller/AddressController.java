package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.security.SecurityUtil;
import et.guzo.service.AddressService;
import et.guzo.web.dto.AddressDto;
import et.guzo.web.dto.AddressRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ApiResponse<List<AddressDto>> list() {
        return ApiResponse.ok(addressService.list(SecurityUtil.requireUser().getId()));
    }

    @PostMapping
    public ApiResponse<AddressDto> create(@RequestBody AddressRequest body) {
        return ApiResponse.ok(addressService.create(SecurityUtil.requireUser().getId(), body), "Address created");
    }

    @PatchMapping("/{id}")
    public ApiResponse<AddressDto> update(@PathVariable String id, @RequestBody AddressRequest body) {
        return ApiResponse.ok(addressService.update(SecurityUtil.requireUser().getId(), id, body), "Address updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        addressService.delete(SecurityUtil.requireUser().getId(), id);
        return ApiResponse.ok(null, "Address deleted");
    }
}
