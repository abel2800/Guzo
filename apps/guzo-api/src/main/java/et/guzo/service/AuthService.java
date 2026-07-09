package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.config.GuzoProperties;
import et.guzo.domain.entity.*;
import et.guzo.domain.enums.DriverApprovalStatus;
import et.guzo.domain.enums.Gender;
import et.guzo.domain.enums.UserStatus;
import et.guzo.domain.enums.FileCategory;
import et.guzo.repository.*;
import et.guzo.security.JwtService;
import et.guzo.security.TokenHasher;
import et.guzo.web.dto.*;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DEFAULT_ROLE = "CUSTOMER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PermissionRepository permissionRepository;
    private final CustomerRepository customerRepository;
    private final MerchantRepository merchantRepository;
    private final DriverRepository driverRepository;
    private final SessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GuzoProperties properties;
    private final GuzoIdService guzoIdService;
    private final NotificationService notificationService;
    private final AddressRepository addressRepository;
    private final StoredFileRepository storedFileRepository;
    private final FileStorageService fileStorageService;
    private final OtpService otpService;

    @Transactional
    public LoginResponse register(RegisterRequest dto, String userAgent, String ip) {
        if (userRepository.existsByEmail(dto.email().toLowerCase())) {
            throw ApiException.conflict("Email is already registered");
        }
        String roleName = dto.role() != null && !dto.role().isBlank() ? dto.role().toUpperCase() : DEFAULT_ROLE;
        if (dto.phone() != null && !dto.phone().isBlank()) {
            otpService.assertRecentlyVerified(dto.phone());
        } else if ("CUSTOMER".equals(roleName)) {
            throw ApiException.badRequest("Phone number is required for customer registration");
        }
        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> ApiException.badRequest("Role " + roleName + " is not configured. Run db:seed."));

        Instant now = Instant.now();
        User user = new User();
        user.setId(IdUtil.cuid());
        user.setEmail(dto.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setPhone(dto.phone());
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userRepository.save(user);
        guzoIdService.assignIfMissing(user);

        UserRole ur = new UserRole();
        ur.setUserId(user.getId());
        ur.setRoleId(role.getId());
        ur.setAssignedAt(now);
        userRoleRepository.save(ur);
        createProfile(roleName, user, now);

        notificationService.notify(user.getId(), "WELCOME", "Welcome to GUZO",
            "Hi " + user.getFirstName() + ", your account is ready.");

        return issueSession(user, userAgent, ip, null);
    }

    @Transactional
    public LoginResponse login(LoginRequest dto, String userAgent, String ip) {
        User user = userRepository.findByEmail(dto.email().toLowerCase())
            .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.forbidden("Account is not active");
        }
        user.setLastLoginAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return issueSession(user, userAgent, ip, null);
    }

    @Transactional
    public RefreshResponse refresh(String refreshToken, String userAgent, String ip) {
        var claims = jwtService.verifyRefreshToken(refreshToken);
        String tokenHash = TokenHasher.sha256(refreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> ApiException.unauthorized("Refresh token is no longer valid"));
        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("Refresh token is no longer valid");
        }
        User user = userRepository.findById(claims.getSubject())
            .orElseThrow(() -> ApiException.unauthorized("Account is not active"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.unauthorized("Account is not active");
        }
        AuthTokensDto tokens = issueTokens(user, userAgent, ip, stored.getSessionId());
        stored.setRevoked(true);
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);
        return new RefreshResponse(tokens);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return;
        refreshTokenRepository.findByTokenHash(TokenHasher.sha256(refreshToken)).ifPresent(stored -> {
            stored.setRevoked(true);
            stored.setRevokedAt(Instant.now());
            refreshTokenRepository.save(stored);
            if (stored.getSessionId() != null) {
                sessionRepository.findById(stored.getSessionId()).ifPresent(session -> {
                    session.setRevoked(true);
                    sessionRepository.save(session);
                });
            }
        });
    }

    @Transactional
    public UserProfileDto updateProfile(String userId, UpdateProfileRequest dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (dto.firstName() != null) user.setFirstName(dto.firstName());
        if (dto.lastName() != null) user.setLastName(dto.lastName());
        if (dto.phone() != null) user.setPhone(dto.phone());
        if (dto.gender() != null && !dto.gender().isBlank()) {
            user.setGender(Gender.valueOf(dto.gender().toUpperCase()));
        }
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return toProfile(user);
    }

    @Transactional
    public UserProfileDto updateLocation(String userId, UpdateLocationRequest dto) {
        Instant now = Instant.now();
        addressRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(a -> {
            a.setDefaultAddress(false);
            a.setUpdatedAt(now);
            addressRepository.save(a);
        });
        Address address = new Address();
        address.setId(IdUtil.cuid());
        address.setUserId(userId);
        address.setLabel(dto.label() != null ? dto.label() : "Primary");
        address.setLine1(dto.line1());
        address.setLine2(dto.line2());
        address.setCity(dto.city());
        address.setState(dto.state());
        address.setPostalCode(dto.postalCode());
        address.setCountry(dto.country() != null ? dto.country() : "ET");
        address.setDefaultAddress(true);
        address.setCreatedAt(now);
        address.setUpdatedAt(now);
        addressRepository.save(address);
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        return toProfile(user);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (!passwordEncoder.matches(dto.currentPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserProfileDto me(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        return toProfile(user);
    }

    private LoginResponse issueSession(User user, String userAgent, String ip, String existingSessionId) {
        AuthTokensDto tokens = issueTokens(user, userAgent, ip, existingSessionId);
        return new LoginResponse(toProfile(user), tokens);
    }

    private AuthTokensDto issueTokens(User user, String userAgent, String ip, String existingSessionId) {
        Instant now = Instant.now();
        String sessionId = existingSessionId;
        if (sessionId == null) {
            Session session = new Session();
            sessionId = IdUtil.cuid();
            session.setId(sessionId);
            session.setUserId(user.getId());
            session.setUserAgent(userAgent);
            session.setIpAddress(ip);
            session.setRevoked(false);
            session.setLastActiveAt(now);
            session.setCreatedAt(now);
            session.setExpiresAt(now.plus(properties.getJwt().getRefreshExpiresDays(), ChronoUnit.DAYS));
            sessionRepository.save(session);
        }

        List<String> roles = roleRepository.findRoleNamesByUserId(user.getId());
        String accessToken = jwtService.signAccessToken(user.getId(), user.getEmail(), roles, sessionId);
        String refreshToken = jwtService.signRefreshToken(user.getId(), sessionId);
        long expiresIn = properties.getJwt().getAccessExpiresMinutes() * 60L;

        RefreshToken rt = new RefreshToken();
        rt.setId(IdUtil.cuid());
        rt.setUserId(user.getId());
        rt.setSessionId(sessionId);
        rt.setTokenHash(TokenHasher.sha256(refreshToken));
        rt.setRevoked(false);
        rt.setUserAgent(userAgent);
        rt.setIpAddress(ip);
        rt.setCreatedAt(now);
        rt.setExpiresAt(now.plus(properties.getJwt().getRefreshExpiresDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(rt);

        return new AuthTokensDto(accessToken, refreshToken, expiresIn);
    }

    private void createProfile(String roleName, User user, Instant now) {
        switch (roleName) {
            case "MERCHANT" -> {
                Merchant m = new Merchant();
                m.setId(IdUtil.cuid());
                m.setUserId(user.getId());
                m.setMerchantCode(IdUtil.merchantCode());
                m.setBusinessName(user.getFirstName() + " " + user.getLastName());
                m.setVerified(false);
                m.setWalletBalance(BigDecimal.ZERO);
                m.setCreatedAt(now);
                m.setUpdatedAt(now);
                merchantRepository.save(m);
            }
            case "DRIVER" -> {
                Driver d = new Driver();
                d.setId(IdUtil.cuid());
                d.setUserId(user.getId());
                d.setDriverCode(IdUtil.driverCode());
                d.setApprovalStatus(DriverApprovalStatus.PENDING);
                d.setAvailable(false);
                d.setCreatedAt(now);
                d.setUpdatedAt(now);
                driverRepository.save(d);
            }
            default -> {
                Customer c = new Customer();
                c.setId(IdUtil.cuid());
                c.setUserId(user.getId());
                c.setCustomerCode(IdUtil.customerCode());
                c.setWalletBalance(BigDecimal.ZERO);
                c.setCreatedAt(now);
                c.setUpdatedAt(now);
                customerRepository.save(c);
            }
        }
    }

    private UserProfileDto toProfile(User user) {
        List<String> roles = roleRepository.findRoleNamesByUserId(user.getId());
        List<String> permissions = permissionRepository.findPermissionKeysByUserId(user.getId());
        UserProfileDto.AddressSummary defaultAddress = addressRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .filter(Address::isDefaultAddress)
            .findFirst()
            .or(() -> addressRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().findFirst())
            .map(a -> new UserProfileDto.AddressSummary(
                a.getId(), a.getLabel(), a.getLine1(), a.getLine2(), a.getCity(), a.getState(),
                a.getPostalCode(), a.getCountry(), a.isDefaultAddress()
            ))
            .orElse(null);
        return new UserProfileDto(
            user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
            user.getPhone(), user.getGuzoId(),
            user.getGender() != null ? user.getGender().name() : null,
            avatarUrl(user),
            roles, permissions,
            user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
            defaultAddress,
            walletBalance(user),
            "ETB"
        );
    }

    @Transactional
    public UserProfileDto uploadAvatar(String userId, org.springframework.web.multipart.MultipartFile file) {
        StoredFile stored = fileStorageService.store(file, userId, FileCategory.AVATAR);
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setAvatarFileId(stored.getId());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return toProfile(user);
    }

    private String avatarUrl(User user) {
        if (user.getAvatarFileId() == null) return null;
        return storedFileRepository.findById(user.getAvatarFileId())
            .map(f -> fileStorageService.publicUrl(f.getStorageKey()))
            .orElse(null);
    }

    private java.math.BigDecimal walletBalance(User user) {
        return customerRepository.findByUserId(user.getId())
            .map(Customer::getWalletBalance)
            .orElseGet(() -> merchantRepository.findByUserId(user.getId())
                .map(Merchant::getWalletBalance)
                .orElse(java.math.BigDecimal.ZERO));
    }
}
