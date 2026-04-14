import { prisma } from './db';

export type LogLevel = 'info' | 'warn' | 'error';
export type LogCategory = 'system' | 'scraper' | 'scheduler' | 'notification' | 'settings';

export async function writeLog(
  level: LogLevel,
  category: LogCategory,
  message: string,
  detail?: string
): Promise<void> {
  try {
    await prisma.sysLog.create({
      data: { level, category, message, detail: detail ?? null },
    });
  } catch {
    // Never let logging failures crash the application
  }
}
