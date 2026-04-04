import path from 'path';
import fs from 'fs/promises';

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  path.join(process.cwd(), 'public', 'uploads');

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function getUploadPath(storedName: string): string {
  return path.join(UPLOAD_DIR, storedName);
}

export async function deleteUploadedFile(storedName: string): Promise<void> {
  const filePath = getUploadPath(storedName);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted
  }
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
