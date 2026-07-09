import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import type { Request } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { UPLOAD_FOLDERS } from '../constants/index.js';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

function makeStorage() {
  return multer.diskStorage({
    destination: (req: Request, _file, cb) => {
      const folder = (req as Request & { uploadFolder?: string }).uploadFolder ?? UPLOAD_FOLDERS.IMAGES;
      const dir = path.resolve(process.cwd(), env.storage.uploadDir, folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      cb(null, name);
    },
  });
}

export const upload = multer({
  storage: makeStorage(),
  limits: { fileSize: env.storage.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

export function uploadTo(folder: string) {
  return (req: Request, _res: unknown, next: (e?: unknown) => void) => {
    (req as Request & { uploadFolder?: string }).uploadFolder = folder;
    next();
  };
}
