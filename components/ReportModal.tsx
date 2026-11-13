'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Loader2, Calendar, User, Building, FileText, Pencil, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toDatetimeLocal, datetimeLocalToISO, formatDataOraIT } from '@/lib/dataIntervento';
import Image from 'next/image';

interface Foto {
  id: number;
  filePath: string;
  fileName: string;
}

interface Attivita {
  id: number;
  descrizione: string;
  stato: string;
  motivazione: string | null;
  note: string | null;
  componente: {
    nome: string;
  } | null;
  foto: Foto[];
}

interface Report {
  id: number;
  codice: string;
  tipo: string;
  stato: string;
  pdfPath: string | null;
  creatoIl: string;
  dataIntervento: string | null;
  modificatoIl: string;
  utenteId: number;
  impianto: {
    nome: string;
    proprieta: string | null;
  };
  utente: {
    username: string;
  };
  attivita: Attivita[];
}

interface ReportModalProps {
  reportId: number;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function ReportModal({ reportId, onClose, onUpdated }: ReportModalProps) {
  const { data: session } = useSession();
  const [editingData, setEditingData] = useState(false);
  const [dataValue, setDataValue] = useState('');
  const [savingData, setSavingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/report/${reportId}`);
      
      if (!res.ok) {
        throw new Error('Report non trovato');
      }

      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      console.error('Errore caricamento report:', err);
      setError(err instanceof Error ? err.message : 'Errore durante caricamento');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fetchReport]);

  const canEditData =
    !!report &&
    !!session &&
    (session.user.ruolo === 'ADMIN' || String(report.utenteId) === String(session.user.id));

  const startEditData = () => {
    if (!report) return;
    setDataValue(toDatetimeLocal(report.dataIntervento ?? report.creatoIl));
    setDataError('');
    setEditingData(true);
  };

  const saveData = async () => {
    const iso = datetimeLocalToISO(dataValue);
    if (!iso) {
      setDataError("Inserisci una data valida");
      return;
    }
    setSavingData(true);
    setDataError('');
    try {
      const res = await fetch(`/api/report/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataIntervento: iso }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Salvataggio non riuscito');
      }
      setEditingData(false);
      await fetchReport();
      onUpdated?.();
    } catch (err: unknown) {
      setDataError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
    } finally {
      setSavingData(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/report/${reportId}/pdf`, '_blank');
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'FATTO':
        return 'bg-green-100 text-green-700';
      case 'NON_FATTO':
        return 'bg-red-100 text-red-700';
      case 'NON_APPLICABILE':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case 'FATTO':
        return '✓ Fatto';
      case 'NON_FATTO':
        return '✗ Non fatto';
      case 'NON_APPLICABILE':
        return '○ Non applicabile';
      default:
        return stato;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {loading ? 'Caricamento...' : report ? `Report ${report.codice}` : 'Report'}
            </h2>
            {report && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    report.tipo === 'MANUTENZIONE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {report.tipo === 'MANUTENZIONE' ? '🔧' : '🧰'}
                  {report.tipo === 'MANUTENZIONE' ? 'Manutenzione' : 'Intervento'}
                </span>
                
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    report.stato === 'COMPLETATO'
                      ? 'bg-green-100 text-green-700'
                      : report.stato === 'IN_LAVORAZIONE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {report.stato === 'COMPLETATO' ? '✅' : report.stato === 'IN_LAVORAZIONE' ? '🔄' : '🟡'}
                  {report.stato === 'COMPLETATO' ? 'Completato' : report.stato === 'IN_LAVORAZIONE' ? 'In Lavorazione' : 'Bozza'}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Caricamento dettagli report...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-800 font-semibold mb-2">Errore</p>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Chiudi
                </button>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={20} />
                  Informazioni Generali
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-700">Data intervento</p>
                      {editingData ? (
                        <div className="mt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="datetime-local"
                              value={dataValue}
                              onChange={(e) => { setDataValue(e.target.value); setDataError(''); }}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={saveData}
                              disabled={savingData}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              {savingData ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              Salva
                            </button>
                            <button
                              onClick={() => setEditingData(false)}
                              disabled={savingData}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white"
                            >
                              Annulla
                            </button>
                          </div>
                          {dataError && <p className="text-red-600 text-xs mt-1">{dataError}</p>}
                          <p className="text-gray-500 text-xs mt-1">Il PDF verrà rigenerato con la nuova data.</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900">{formatDataOraIT(report.dataIntervento ?? report.creatoIl)}</p>
                          {canEditData && (
                            <button
                              onClick={startEditData}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                              title="Modifica data intervento"
                            >
                              <Pencil size={12} />
                              Modifica
                            </button>
                          )}
                        </div>
                      )}
                      {report.dataIntervento && !editingData && (
                        <p className="text-gray-500 text-xs mt-0.5">Creato il {formatDataOraIT(report.creatoIl)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Operatore</p>
                      <p className="text-gray-900">{report.utente.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Building size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Impianto</p>
                      <p className="text-gray-900">{report.impianto.nome}</p>
                    </div>
                  </div>

                  {report.impianto.proprieta && (
                    <div className="flex items-start gap-2">
                      <Building size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-700">Proprietà</p>
                        <p className="text-gray-900">{report.impianto.proprieta}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  Attività ({report.attivita.length})
                </h3>

                {report.attivita.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    Nessuna attività registrata
                  </div>
                ) : (
                  <div className="space-y-4">
                    {report.attivita.map((att, index) => (
                      <div
                        key={att.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <h4 className="font-semibold text-gray-900 flex-1">
                            {index + 1}. {att.descrizione}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatoColor(
                              att.stato
                            )}`}
                          >
                            {getStatoLabel(att.stato)}
                          </span>
                        </div>

                        {att.componente && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Componente:</span> {att.componente.nome}
                          </p>
                        )}

                        {att.motivazione && (
                          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-red-700 mb-1">
                              Motivazione:
                            </p>
                            <p className="text-sm text-red-900">{att.motivazione}</p>
                          </div>
                        )}

                        {att.note && (
                          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-blue-700 mb-1">Note:</p>
                            <p className="text-sm text-blue-900">{att.note}</p>
                          </div>
                        )}

                        {att.foto.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Foto ({att.foto.length}):
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {att.foto.map((foto) => {
                                const storedFilename = foto.filePath?.split('/').pop() || '';
                                const imageUrl = storedFilename ? `/api/uploads/${encodeURIComponent(storedFilename)}` : '';
                                return (
                                  <div key={foto.id} className="group relative">
                                    {imageUrl ? (
                                      <Image
                                        src={imageUrl}
                                        alt={foto.fileName}
                                        width={200}
                                        height={200}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                                        <span className="text-xs text-gray-500">Non disponibile</span>
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      {foto.fileName}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Chiudi
          </button>
          
          {report?.stato === 'COMPLETATO' && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Download size={20} />
              Scarica PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
