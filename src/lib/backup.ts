import fs from 'fs';
import path from 'path';
import { prisma } from './db';

export interface BackupInfo {
  filename: string;
  createdAt: string; // ISO string
  sizeBytes: number;
  label: 'auto' | 'manual';
}

function getDbPath(): string {
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  // Parse "file:./prisma/dev.db?..." → "./prisma/dev.db"
  const match = url.match(/^file:([^?]+)/);
  const relative = match ? match[1] : './prisma/dev.db';
  const resolved = path.resolve(process.cwd(), relative);
  // Fallback: if resolved path doesn't exist (e.g. absolute Mac path on Linux server),
  // try the standard relative location
  if (!fs.existsSync(resolved)) {
    const fallback = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(fallback)) return fallback;
  }
  return resolved;
}

function getBackupDir(): string {
  const dir = process.env.BACKUP_DIR ?? path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function createBackup(label: 'auto' | 'manual'): Promise<string> {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) throw new Error(`DB-Datei nicht gefunden: ${dbPath}`);

  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${ts}_${label}.db`;
  const destPath = path.join(getBackupDir(), filename);

  fs.copyFileSync(dbPath, destPath);

  // Prune: keep only most recent 10 auto backups
  if (label === 'auto') {
    const all = listBackupsSync();
    const autoOnes = all.filter((b) => b.label === 'auto');
    if (autoOnes.length > 10) {
      const toDelete = autoOnes.slice(10);
      for (const b of toDelete) {
        const p = path.join(getBackupDir(), b.filename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }
  }

  return filename;
}

function listBackupsSync(): BackupInfo[] {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.db'))
    .map((filename) => {
      const stats = fs.statSync(path.join(dir, filename));
      // filename: "2026-04-06T23-00-00_auto.db"
      const labelMatch = filename.match(/_(\w+)\.db$/);
      const label = (labelMatch?.[1] === 'manual' ? 'manual' : 'auto') as 'auto' | 'manual';
      const isoTs = filename.slice(0, 19).replace(/-/g, (m, offset) => {
        // Reconstruct ISO from "2026-04-06T23-00-00" → "2026-04-06T23:00:00"
        if (offset === 13 || offset === 16) return ':';
        return m;
      });
      return {
        filename,
        createdAt: new Date(isoTs).toISOString(),
        sizeBytes: stats.size,
        label,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listBackups(): Promise<BackupInfo[]> {
  return listBackupsSync();
}

export async function restoreBackup(filename: string): Promise<void> {
  // Security: reject path traversal
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new Error('Ungültiger Dateiname');
  }
  if (!filename.endsWith('.db')) throw new Error('Ungültige Dateiendung');

  const backupPath = path.join(getBackupDir(), filename);
  if (!fs.existsSync(backupPath)) throw new Error('Backup-Datei nicht gefunden');

  const dbPath = getDbPath();

  await prisma.$disconnect();
  fs.copyFileSync(backupPath, dbPath);
  await prisma.$connect();
}
