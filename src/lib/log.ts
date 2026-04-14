import { prisma } from './db';

export type LogLevel = 'info' | 'warn' | 'error';
export type LogCategory = 'system' | 'backup' | 'ki' | 'garten' | 'einstellungen' | 'import';

/**
 * Write a log entry to the database. Never throws — logging failures are silently ignored.
 */
export async function writeLog(
  level: LogLevel,
  category: LogCategory,
  message: string,
  detail?: string
): Promise<void> {
  try {
    await prisma.systemLog.create({ data: { level, category, message, detail: detail ?? null } });
  } catch {
    // Never let logging failures crash the application
  }
}
