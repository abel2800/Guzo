import { env } from '../../config/env.js';
import type { StorageProvider } from './storage.interface.js';
import { LocalStorageProvider } from './local.storage.js';

/**
 * Storage factory. Add S3StorageProvider / MinioStorageProvider here later and
 * select by STORAGE_DRIVER. Consumers import `storage` and never care which.
 */
function createStorage(): StorageProvider {
  switch (env.storage.driver) {
    case 'local':
    default:
      return new LocalStorageProvider();
    // case 's3': return new S3StorageProvider();
    // case 'minio': return new MinioStorageProvider();
  }
}

export const storage = createStorage();
export type { StorageProvider, StoredFile } from './storage.interface.js';
