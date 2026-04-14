const g = globalThis as { __schedulerRegistered?: boolean };

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !g.__schedulerRegistered) {
    g.__schedulerRegistered = true;
    try {
      const cron = await import('node-cron');
      const { schedulerTick } = await import('./lib/scheduler');

      // Run every minute — DB-driven intervals per URL
      cron.schedule('* * * * *', async () => {
        try {
          await schedulerTick();
        } catch (err) {
          console.error('[Scheduler] Tick error:', err);
        }
      });

      console.log('[Preisalarm] Scheduler started (DB-driven, 1-min tick)');
    } catch (err) {
      console.warn('[Preisalarm] Could not start scheduler:', err);
    }
  }
}
