import { prisma } from './db';
import { writeLog } from './log';
import { formatPrice, convertToChf } from './swiss';
import type { Alert, TrackedUrl } from '@prisma/client';

async function getSmtpSettings(): Promise<Record<string, string>> {
  const keys = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom', 'notifyEmail'];
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    smtpHost: process.env.SMTP_HOST ?? db.smtpHost ?? '',
    smtpPort: process.env.SMTP_PORT ?? db.smtpPort ?? '587',
    smtpUser: process.env.SMTP_USER ?? db.smtpUser ?? '',
    smtpPass: process.env.SMTP_PASS ?? db.smtpPass ?? '',
    smtpFrom: process.env.SMTP_FROM ?? db.smtpFrom ?? '',
    notifyEmail: process.env.NOTIFY_EMAIL ?? db.notifyEmail ?? '',
  };
}

async function getTelegramSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: ['telegramToken', 'telegramChatId'] } } });
  const db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    telegramToken: process.env.TELEGRAM_TOKEN ?? db.telegramToken ?? '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID ?? db.telegramChatId ?? '',
  };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const nodemailer = (await import('nodemailer')).default;
    const cfg = await getSmtpSettings();
    if (!cfg.smtpHost || !cfg.smtpUser) { await writeLog('warn', 'notification', 'SMTP not configured'); return false; }
    const transporter = nodemailer.createTransport({ host: cfg.smtpHost, port: parseInt(cfg.smtpPort, 10), secure: cfg.smtpPort === '465', auth: { user: cfg.smtpUser, pass: cfg.smtpPass } });
    await transporter.sendMail({ from: cfg.smtpFrom || cfg.smtpUser, to, subject, html });
    return true;
  } catch (err) {
    await writeLog('error', 'notification', 'Email send failed', String(err));
    return false;
  }
}

export async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  try {
    const TelegramBot = (await import('node-telegram-bot-api')).default;
    const cfg = await getTelegramSettings();
    if (!cfg.telegramToken || !chatId) { await writeLog('warn', 'notification', 'Telegram not configured'); return false; }
    const bot = new TelegramBot(cfg.telegramToken);
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    return true;
  } catch (err) {
    await writeLog('error', 'notification', 'Telegram send failed', String(err));
    return false;
  }
}

export async function triggerAlert(alert: Alert, trackedUrl: TrackedUrl, newPrice: number, currency: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: alert.productId } });
  const priceChf = currency !== 'CHF' ? convertToChf(newPrice, currency) : newPrice;
  const targetChf = alert.currency !== 'CHF' ? convertToChf(alert.targetPrice, alert.currency) : alert.targetPrice;
  const savingsAbs = Math.max(0, targetChf - priceChf);
  const savingsPct = targetChf > 0 ? ((savingsAbs / targetChf) * 100).toFixed(1) : '0';
  const priceStr = formatPrice(newPrice, currency);
  const targetStr = formatPrice(alert.targetPrice, alert.currency);
  const shopLabel = trackedUrl.shopName ?? trackedUrl.shopDomain ?? new URL(trackedUrl.url).hostname;
  const subject = `Preisalarm: ${product?.name ?? 'Produkt'} jetzt ${priceStr}`;
  const htmlBody = `<h2 style="color:#1d4ed8">Preisalarm!</h2><p><strong>${product?.name}</strong> unter Zielpreis.</p><table><tr><td>Preis</td><td><strong>${priceStr}</strong></td></tr><tr><td>Ziel</td><td>${targetStr}</td></tr><tr><td>Ersparnis</td><td>${formatPrice(savingsAbs,'CHF')} (${savingsPct}%)</td></tr><tr><td>Shop</td><td>${shopLabel}</td></tr></table><p><a href="${trackedUrl.url}">Jetzt kaufen</a></p>`;
  const telegramMsg = `🔔 <b>Preisalarm!</b>\n<b>${product?.name}</b>\nPreis: <b>${priceStr}</b> (Ziel: ${targetStr})\nShop: ${shopLabel}\n<a href="${trackedUrl.url}">Zum Shop</a>`;
  const cfg = await getSmtpSettings();
  const tgCfg = await getTelegramSettings();
  if (alert.notifyEmail && cfg.notifyEmail) {
    const ok = await sendEmail(cfg.notifyEmail, subject, htmlBody);
    await prisma.notification.create({ data: { alertId: alert.id, trackedUrlId: trackedUrl.id, price: newPrice, currency, channel: 'email', success: ok, errorMessage: ok ? null : 'Send failed' } });
  }
  if (alert.notifyTelegram && tgCfg.telegramChatId) {
    const ok = await sendTelegram(tgCfg.telegramChatId, telegramMsg);
    await prisma.notification.create({ data: { alertId: alert.id, trackedUrlId: trackedUrl.id, price: newPrice, currency, channel: 'telegram', success: ok, errorMessage: ok ? null : 'Send failed' } });
  }
  await prisma.alert.update({ where: { id: alert.id }, data: { lastTriggered: new Date() } });
  await writeLog('info', 'notification', `Alert triggered: ${product?.name} @ ${priceStr} (${shopLabel})`);
}
