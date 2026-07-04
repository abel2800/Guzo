import path from 'node:path';
import fs from 'node:fs/promises';
import { env } from '../../config/env.js';
import type { StorageProvider, StoredFile } from './storage.interface.js';

/** Filesystem storage under apps/server/uploads/<folder>/<filename>. */
export class LocalStorageProvider implements StorageProvider {
  readonly driver = 'local';

  async save(input: { absolutePath: string; folder: string; filename: string }): Promise<StoredFile> {
    // Multer already wrote the file to the right folder; we just compute the key.
    const storageKey = path.posix.join(env.storage.uploadDir, input.folder, input.filename);
    return { storageKey, url: this.getUrl(storageKey), driver: this.driver };
  }

  getUrl(storageKey: string): string {
    return `${env.publicUrl}/static/${storageKey.replace(/^uploads\//, '')}`;
  }

  async delete(storageKey: string): Promise<void> {
    const abs = path.resolve(process.cwd(), storageKey);
    await fs.rm(abs, { force: true });
  }
}
