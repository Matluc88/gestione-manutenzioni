'use client';

import { useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Foto {
  id: number;
  filePath: string;
  fileName: string;
}

interface FotoUploadProps {
  attivitaId: number | null;
  foto: Foto[];
  onFotoAdded: (foto: Foto) => void;
  onFotoRemoved: (fotoId: number) => void;
  required?: boolean;
}

export default function FotoUpload({
  attivitaId,
  foto,
  onFotoAdded,
  onFotoRemoved,
  required = false,
}: FotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!attivitaId) {
      setError('Salva prima l\'attività per caricare foto');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attivitaId', attivitaId.toString());

      const res = await fetch('/api/foto/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore upload');
      }

      const newFoto = await res.json();
      onFotoAdded(newFoto);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante upload';
      setError(errorMessage);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fotoId: number) => {
    if (!confirm('Eliminare questa foto?')) return;

    try {
      const res = await fetch(`/api/foto/${fotoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onFotoRemoved(fotoId);
      }
    } catch {
      alert('Errore durante eliminazione foto');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Foto {required && <span className="text-red-600">*</span>}
        </label>
        <span className="text-xs text-gray-500">
          {foto.length} foto caricate
        </span>
      </div>

      {foto.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {foto.map((f) => (
            <div key={f.id} className="relative group">
              <Image
                src={f.filePath}
                alt={f.fileName}
                width={300}
                height={300}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => handleDelete(f.id)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
              >
                <X size={16} />
              </button>
              <p className="text-xs text-gray-500 mt-1 truncate">{f.fileName}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition disabled:bg-gray-400">
          {uploading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Upload size={20} />
          )}
          {uploading ? 'Caricamento...' : 'Carica da galleria'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition disabled:bg-gray-400">
          {uploading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Camera size={20} />
          )}
          {uploading ? 'Caricamento...' : 'Scatta foto'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {required && foto.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm">
          ⚠️ Almeno una foto è obbligatoria per questa attività
        </div>
      )}
    </div>
  );
}
