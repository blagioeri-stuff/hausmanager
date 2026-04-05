'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatFileSize } from '@/lib/formatters';
import { COMPONENT_TYPES } from '@/lib/component-types';
import type { RawDocument } from '@/types';

interface Props {
  componentId: string;
  initialDocuments: RawDocument[];
}

interface AnalysisResult {
  description: string | null;
  date: string | null;
  costChf: number | null;
  serviceProvider: string | null;
  suggestedTypeKey: string | null;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export function DocumentList({ componentId, initialDocuments }: Props) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI analysis state
  const [analyzing, setAnalyzing] = useState<string | null>(null); // storedName of doc being analyzed
  const [analysisDoc, setAnalysisDoc] = useState<RawDocument | null>(null);
  const [analysisDescription, setAnalysisDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceSaved, setMaintenanceSaved] = useState(false);

  const refresh = async () => {
    const res = await fetch(`/api/components/${componentId}/documents`);
    setDocuments(await res.json());
    router.refresh();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/components/${componentId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Upload fehlgeschlagen: ' + (err.error ?? 'Unbekannter Fehler'));
        return;
      }
      await refresh();
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`«${filename}» wirklich löschen?`)) return;
    await fetch(`/api/components/${componentId}/documents/${id}`, { method: 'DELETE' });
    await refresh();
  };

  const openAnalysis = (doc: RawDocument) => {
    setAnalysisDoc(doc);
    setAnalysisDescription('');
    setAnalysisResult(null);
    setAnalysisError(null);
    setMaintenanceSaved(false);
  };

  const runAnalysis = async () => {
    if (!analysisDoc) return;
    setAnalyzing(analysisDoc.storedName);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storedName: analysisDoc.storedName,
          mimeType: analysisDoc.mimeType,
          description: analysisDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalysisError(data.error ?? 'Fehler bei der Analyse');
      } else {
        setAnalysisResult(data);
      }
    } catch {
      setAnalysisError('Netzwerkfehler');
    } finally {
      setAnalyzing(null);
    }
  };

  const saveMaintenance = async () => {
    if (!analysisResult) return;
    setSavingMaintenance(true);
    try {
      const res = await fetch(`/api/components/${componentId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: analysisResult.date ?? new Date().toISOString().slice(0, 10),
          description: analysisResult.description ?? '(aus Dokument extrahiert)',
          costChf: analysisResult.costChf ?? undefined,
          serviceProvider: analysisResult.serviceProvider ?? undefined,
        }),
      });
      if (res.ok) {
        setMaintenanceSaved(true);
        router.refresh();
      }
    } finally {
      setSavingMaintenance(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Dokumente & Fotos</h2>
          {documents.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{documents.length} Datei{documents.length !== 1 ? 'en' : ''}</p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
          + Datei hochladen
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} />
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center text-sm transition-colors mb-4 ${
          dragOver ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        {uploading ? 'Wird hochgeladen…' : 'Datei hierher ziehen oder klicken (PDF, Bilder · max. 20 MB)'}
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-400">Noch keine Dokumente.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
              <FileIcon mimeType={doc.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openAnalysis(doc)}
                  title="Mit KI analysieren"
                  className="text-xs text-purple-500 hover:text-purple-700 px-2 py-1 rounded hover:bg-purple-50 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  KI
                </button>
                <a
                  href={`/api/upload/${doc.storedName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                >
                  Öffnen
                </a>
                <button
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Modal */}
      <Modal
        open={analysisDoc !== null}
        onClose={() => setAnalysisDoc(null)}
        title="Dokument mit KI analysieren"
      >
        {analysisDoc && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-gray-700">{analysisDoc.filename}</p>
              <p className="text-xs text-gray-400">{formatFileSize(analysisDoc.sizeBytes)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontext (optional)</label>
              <input
                type="text"
                value={analysisDescription}
                onChange={(e) => setAnalysisDescription(e.target.value)}
                placeholder="z.B. «Rechnung Heizungsservice 2024»"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!analysisResult && (
              <Button
                onClick={runAnalysis}
                loading={analyzing === analysisDoc.storedName}
                className="w-full justify-center"
              >
                Dokument analysieren
              </Button>
            )}

            {analysisError && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {analysisError}
              </div>
            )}

            {analysisResult && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">KI-Ergebnis</p>
                  {analysisResult.description && (
                    <div>
                      <p className="text-xs text-gray-500">Beschreibung</p>
                      <p className="text-sm text-gray-900">{analysisResult.description}</p>
                    </div>
                  )}
                  {analysisResult.date && (
                    <div>
                      <p className="text-xs text-gray-500">Datum</p>
                      <p className="text-sm text-gray-900">{analysisResult.date}</p>
                    </div>
                  )}
                  {analysisResult.costChf !== null && (
                    <div>
                      <p className="text-xs text-gray-500">Betrag</p>
                      <p className="text-sm font-medium text-gray-900">CHF {analysisResult.costChf?.toLocaleString('de-CH')}</p>
                    </div>
                  )}
                  {analysisResult.serviceProvider && (
                    <div>
                      <p className="text-xs text-gray-500">Firma / Handwerker</p>
                      <p className="text-sm text-gray-900">{analysisResult.serviceProvider}</p>
                    </div>
                  )}
                  {analysisResult.suggestedTypeKey && COMPONENT_TYPES[analysisResult.suggestedTypeKey] && (
                    <div>
                      <p className="text-xs text-gray-500">Vorgeschlagener Typ</p>
                      <p className="text-sm text-gray-900">{COMPONENT_TYPES[analysisResult.suggestedTypeKey].labelDe}</p>
                    </div>
                  )}
                </div>

                {maintenanceSaved ? (
                  <p className="text-sm text-green-600 text-center">Wartungseintrag gespeichert!</p>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={saveMaintenance} loading={savingMaintenance} className="flex-1 justify-center">
                      Als Wartungseintrag speichern
                    </Button>
                    <Button variant="secondary" onClick={runAnalysis} loading={analyzing === analysisDoc.storedName}>
                      Neu analysieren
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
