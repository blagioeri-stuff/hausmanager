'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatDate, formatFileSize } from '@/lib/formatters';
import type { RawDocument } from '@/types';

interface Props {
  componentId: string;
  initialDocuments: RawDocument[];
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
    </div>
  );
}
