export interface StoredFile {
  storageKey: string;
  url: string;
  driver: string;
}

export interface StorageProvider {
  readonly driver: string;
    save(input: { absolutePath: string; folder: string; filename: string }): Promise<StoredFile>;
    getUrl(storageKey: string): string;
    delete(storageKey: string): Promise<void>;
}
