import { prisma } from './db';
import { writeLog } from './log';
import { detectPrice, normalizeUrl } from './scraper';
import { triggerAlert } from './notifications';

let isRunning = false;

export async function checkTrackedUrl(trackedUrlId: string): Promise<void> {
  const trackedUrl = await prisma.trackedUrl.findUnique({
    where: { id: trackedUrlId },
    include: {
      product: {
        include: { alerts: { where: { active: true } } },
      },
    },
  });
  if (!trackedUrl || !trackedUrl.active) return;

  await writeLog('info', 'scraper', `Checking: ${trackedUrl.url}`);

  const result = await detectPrice(trackedUrl.url, {
    cssSelector: trackedUrl.cssSelector ?? undefined,
  });

  const now = new Date();

  if (!result.price) {
    const newErrorCount = trackedUrl.errorCount + 1;
    const stillActive = newErrorCount < 5;
    await prisma.trackedUrl.update({
      where: { id: trackedUrlId },
      data: {
        errorCount: newErrorCount,
        lastError: result.error ?? 'Price extraction failed',
        lastChecked: now,
        active: stillActive,
        detectionMethod: 'failed',
      },
    });
    if (!stillActive) {
      await writeLog('warn', 'scraper',
        `Auto-disabled after 5 errors: ${trackedUrl.url}`, result.error);
    }
    return;
  }

  await prisma.pricePoint.create({
    data: { trackedUrlId, price: result.price, currency: result.currency, available: result.availability },
  });

  const domain = (() => {
    try { return new URL(normalizeUrl(trackedUrl.url)).hostname.replace(/^www\./, ''); }
    catch { return trackedUrl.shopDomain ?? null; }
  })();

  await prisma.trackedUrl.update({
    where: { id: trackedUrlId },
    data: {
      lastPrice: result.price,
      lastChecked: now,
      errorCount: 0,
      lastError: null,
      detectionMethod: result.method,
      shopDomain: trackedUrl.shopDomain ?? domain,
      shopName: trackedUrl.shopName ?? result.shopName ?? domain,
    },
  });

  for (const alert of trackedUrl.product.alerts) {
    if (result.price <= alert.targetPrice) {
      const hoursAgo = alert.lastTriggered
        ? (now.getTime() - alert.lastTriggered.getTime()) / 3_600_000
        : Infinity;
      if (hoursAgo >= 24) {
        await triggerAlert(alert, trackedUrl, result.price, result.currency);
      }
    }
  }

  await writeLog('info', 'scraper',
    `${trackedUrl.shopName ?? trackedUrl.url}: ${result.currency} ${result.price} (${result.method})`);
}

export async function schedulerTick(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const urls = await prisma.trackedUrl.findMany({ where: { active: true } });
    const now = Date.now();
    const due = urls.filter((u) => {
      if (!u.lastChecked) return true;
      const nextCheck = u.lastChecked.getTime() + u.checkIntervalHours * 3_600_000;
      return now >= nextCheck;
    });

    if (due.length > 0) {
      await writeLog('info', 'scheduler', `Tick: ${due.length} URL(s) due for check`);
    }

    for (const url of due) {
      try {
        await checkTrackedUrl(url.id);
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        await writeLog('error', 'scheduler', `Error checking ${url.url}`, String(err));
      }
    }
  } finally {
    isRunning = false;
  }
}
