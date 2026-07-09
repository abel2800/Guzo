import { env } from '../../config/env.js';
import type { StorageProvider } from './storage.interface.js';
import { LocalStorageProvider } from './local.storage.js';

function createStorage(): StorageProvider {
  switch (env.storage.driver) {
    case 'local':
    default:
      return new LocalStorageProvider();

  }
}

export const storage = createStorage();
export type { StorageProvider, StoredFile } from './storage.interface.js';
