package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Customer;
import et.guzo.domain.entity.Merchant;
import et.guzo.domain.entity.WalletTransaction;
import et.guzo.domain.enums.WalletTxnType;
import et.guzo.repository.CustomerRepository;
import et.guzo.repository.MerchantRepository;
import et.guzo.repository.WalletTransactionRepository;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final CustomerRepository customerRepository;
    private final MerchantRepository merchantRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> summary(String userId) {
        BalanceHolder balance = resolveBalance(userId);
        return Map.of(
            "balance", balance.balance(),
            "currency", "ETB",
            "holderType", balance.holderType()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> transactions(String userId, int page, int limit) {
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<WalletTransaction> result = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        var items = result.getContent().stream().map(t -> Map.<String, Object>of(
            "id", t.getId(),
            "type", t.getType().name(),
            "amount", t.getAmount(),
            "balanceAfter", t.getBalanceAfter(),
            "currency", t.getCurrency(),
            "reference", t.getReference() != null ? t.getReference() : "",
            "description", t.getDescription() != null ? t.getDescription() : "",
            "createdAt", t.getCreatedAt().toString()
        )).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional
    public Map<String, Object> topUp(String userId, BigDecimal amount, String description) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        BalanceHolder holder = resolveBalance(userId);
        BigDecimal newBalance = holder.balance().add(amount);
        persistBalance(userId, holder, newBalance);
        WalletTransaction txn = record(userId, WalletTxnType.CREDIT, amount, newBalance, "TOPUP", description != null ? description : "Wallet top-up");
        return Map.of(
            "balance", newBalance,
            "currency", "ETB",
            "transaction", Map.of("id", txn.getId(), "type", txn.getType().name(), "amount", txn.getAmount())
        );
    }

    private WalletTransaction record(String userId, WalletTxnType type, BigDecimal amount, BigDecimal balanceAfter, String reference, String description) {
        WalletTransaction txn = new WalletTransaction();
        txn.setId(IdUtil.cuid());
        txn.setUserId(userId);
        txn.setType(type);
        txn.setAmount(amount);
        txn.setBalanceAfter(balanceAfter);
        txn.setCurrency("ETB");
        txn.setReference(reference);
        txn.setDescription(description);
        txn.setCreatedAt(Instant.now());
        return walletTransactionRepository.save(txn);
    }

    private BalanceHolder resolveBalance(String userId) {
        return customerRepository.findByUserId(userId)
            .map(c -> new BalanceHolder("CUSTOMER", c.getWalletBalance() != null ? c.getWalletBalance() : BigDecimal.ZERO))
            .orElseGet(() -> merchantRepository.findByUserId(userId)
                .map(m -> new BalanceHolder("MERCHANT", m.getWalletBalance() != null ? m.getWalletBalance() : BigDecimal.ZERO))
                .orElse(new BalanceHolder("NONE", BigDecimal.ZERO)));
    }

    private void persistBalance(String userId, BalanceHolder holder, BigDecimal balance) {
        if ("CUSTOMER".equals(holder.holderType())) {
            Customer c = customerRepository.findByUserId(userId).orElseThrow(() -> ApiException.notFound("Customer not found"));
            c.setWalletBalance(balance);
            c.setUpdatedAt(Instant.now());
            customerRepository.save(c);
        } else if ("MERCHANT".equals(holder.holderType())) {
            Merchant m = merchantRepository.findByUserId(userId).orElseThrow(() -> ApiException.notFound("Merchant not found"));
            m.setWalletBalance(balance);
            m.setUpdatedAt(Instant.now());
            merchantRepository.save(m);
        } else {
            throw ApiException.badRequest("Wallet not available for this account type");
        }
    }

    private record BalanceHolder(String holderType, BigDecimal balance) {}
}
