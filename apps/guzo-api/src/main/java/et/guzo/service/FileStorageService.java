package et.guzo.service;

import et.guzo.config.GuzoProperties;
import et.guzo.domain.entity.StoredFile;
import et.guzo.domain.enums.FileCategory;
import et.guzo.repository.StoredFileRepository;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final GuzoProperties properties;
    private final StoredFileRepository storedFileRepository;

    public StoredFile store(MultipartFile file, String uploaderId, FileCategory category) {
        try {
            Path root = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
            Files.createDirectories(root);
            String storedName = UUID.randomUUID() + "-" + sanitize(file.getOriginalFilename());
            Path target = root.resolve(storedName);
            Files.copy(file.getInputStream(), target);

            Instant now = Instant.now();
            StoredFile row = new StoredFile();
            row.setId(IdUtil.cuid());
            row.setUploaderId(uploaderId);
            row.setCategory(category);
            row.setOriginalName(file.getOriginalFilename() != null ? file.getOriginalFilename() : storedName);
            row.setStoredName(storedName);
            row.setMimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            row.setSizeBytes((int) file.getSize());
            row.setStorageKey(storedName);
            row.setStorageDriver("local");
            row.setCreatedAt(now);
            return storedFileRepository.save(row);
        } catch (IOException e) {
            throw et.guzo.common.ApiException.badRequest("Failed to store file: " + e.getMessage());
        }
    }

    public String publicUrl(String storageKey) {
        if (storageKey == null) return null;
        return "/static/" + storageKey;
    }

    public Path resolve(String storageKey) {
        return Path.of(properties.getUploadDir()).toAbsolutePath().normalize().resolve(storageKey);
    }

    private static String sanitize(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
