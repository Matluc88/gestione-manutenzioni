'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function LogoTab() {
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/impostazioni');
      const data = await res.json();
      setLogoPath(data.logoPath);
    } catch (error) {
      console.error('Errore caricamento logo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: '❌ Formato non supportato. Usa JPG, PNG o WebP',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: '❌ File troppo grande. Massimo 5MB',
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/impostazioni/logo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante upload');
      }

      const data = await res.json();
      setLogoPath(data.logoPath);
      setMessage({ type: 'success', text: '✅ Logo caricato con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: `❌ ${error instanceof Error ? error.message : 'Errore sconosciuto'}` });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare il logo?')) {
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/impostazioni/logo', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Errore durante eliminazione');
      }

      setLogoPath(null);
      setMessage({ type: 'success', text: '✅ Logo eliminato' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: `❌ ${error instanceof Error ? error.message : 'Errore sconosciuto'}` });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ Il logo verrà visualizzato nell&apos;header dei PDF generati. Formati supportati: JPG,
          PNG, WebP. Dimensione massima: 5MB. Il logo verrà automaticamente ottimizzato.
        </p>
      </div>

      {logoPath && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Logo attuale</h3>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
            >
              {deleting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              Elimina
            </button>
          </div>

          <div className="flex justify-center bg-white border-2 border-gray-300 rounded-lg p-8">
            <Image
              src={logoPath}
              alt="Logo aziendale"
              width={400}
              height={200}
              className="max-h-48 w-auto object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          {logoPath ? 'Carica nuovo logo' : 'Carica logo'}
        </h3>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-gray-600 font-medium">Caricamento in corso...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="text-gray-600" size={32} />
              </div>

              <div>
                <p className="text-gray-700 font-medium mb-1">
                  Trascina qui il logo oppure{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    clicca per selezionare
                  </button>
                </p>
                <p className="text-sm text-gray-500">JPG, PNG o WebP • Massimo 5MB</p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Seleziona file
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Suggerimenti:</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Usa un logo su sfondo trasparente (PNG) per risultati migliori</li>
          <li>Il logo verrà ridimensionato a massimo 400px di larghezza per i PDF</li>
          <li>Preferisci loghi orizzontali piuttosto che verticali</li>
          <li>Risoluzione consigliata: almeno 800x200 pixel</li>
        </ul>
      </div>
    </div>
  );
}
