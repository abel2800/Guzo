package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.Branch;
import et.guzo.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;

    @Transactional(readOnly = true)
    public List<Branch> listActive(String city) {
        if (city != null && !city.isBlank()) {
            return branchRepository.findByActiveTrueAndCityIgnoreCase(city.trim());
        }
        return branchRepository.findByActiveTrue().stream()
            .sorted(Comparator.comparing(Branch::getCity).thenComparing(Branch::getName))
            .toList();
    }

    @Transactional(readOnly = true)
    public Branch getById(String id) {
        return branchRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Branch not found"));
    }

    @Transactional
    public Branch create(Branch branch) {
        if (branch.getId() == null || branch.getId().isBlank()) {
            branch.setId("br_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        }
        return branchRepository.save(branch);
    }

    @Transactional(readOnly = true)
    public List<Branch> listAll() {
        return branchRepository.findAllByOrderByCityAscNameAsc();
    }

    @Transactional
    public Branch update(String id, Map<String, Object> patch) {
        Branch branch = getById(id);
        if (patch.containsKey("queueLevel")) {
            branch.setQueueLevel(((Number) patch.get("queueLevel")).intValue());
        }
        if (patch.containsKey("name")) branch.setName(String.valueOf(patch.get("name")));
        if (patch.containsKey("phone")) branch.setPhone(String.valueOf(patch.get("phone")));
        if (patch.get("isActive") instanceof Boolean active) branch.setActive(active);
        return branchRepository.save(branch);
    }
}
