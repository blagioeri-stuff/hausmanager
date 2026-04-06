export async function register() {
  // Only run on Node.js runtime (not Edge), and only in server context
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { createBackup } = await import('./lib/backup');
      const cron = await import('node-cron');

      // Daily at midnight Zurich time
      cron.schedule(
        '0 0 * * *',
        async () => {
          try {
            const filename = await createBackup('auto');
            console.log(`[Backup] Automatische Sicherung erstellt: ${filename}`);
          } catch (err) {
            console.error('[Backup] Fehler bei automatischer Sicherung:', err);
          }
        },
        { timezone: 'Europe/Zurich' }
      );

      console.log('[Backup] Cron-Job aktiv: täglich um Mitternacht (Europe/Zurich)');
    } catch (err) {
      console.warn('[Backup] Cron-Job konnte nicht gestartet werden:', err);
    }
  }
}
