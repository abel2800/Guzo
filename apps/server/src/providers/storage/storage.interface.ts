export interface StoredFile {
  storageKey: string;
  url: string;
  driver: string;
}

/**
 * Storage abstraction. `local` driver is used now; swap to S3/MinIO later by
 * implementing this same interface - no controller/service changes required.
 */
export interface StorageProvider {
  readonly driver: string;
  /** Persist a file already written to a temp/local path and return its key + url. */
  save(input: { absolutePath: string; folder: string; filename: string }): Promise<StoredFile>;
  /** Resolve a public URL for a stored key. */
  getUrl(storageKey: string): string;
  /** Remove a stored file. */
  delete(storageKey: string): Promise<void>;
}
