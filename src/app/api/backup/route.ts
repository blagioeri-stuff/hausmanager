import { NextRequest, NextResponse } from 'next/server';
import { createBackup, listBackups, restoreBackup } from '@/lib/backup';

export async function GET() {
  try {
    const backups = await listBackups();
    return NextResponse.json(backups);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, filename } = await req.json();

    if (action === 'create') {
      const name = await createBackup('manual');
      return NextResponse.json({ ok: true, filename: name });
    }

    if (action === 'restore') {
      if (!filename) return NextResponse.json({ error: 'Kein Dateiname angegeben' }, { status: 400 });
      await restoreBackup(filename);
      return NextResponse.json({ ok: true, message: 'Backup wiederhergestellt. Bitte Seite neu laden.' });
    }

    return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
