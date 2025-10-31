'use client';

import { useState } from 'react';
import { Eye, Download, Edit, Trash2, Loader2, FileText } from 'lucide-react';

interface Report {
  id: number;
  codice: string;
  tipo: string;
  stato: string;
  pdfPath: string | null;
  creatoIl: string;
  numAttivita: number;
  impiantoId: number;
  impianto: {
    nome: string;
    proprieta: string | null;
  };
  utente: {
    username: string;
  };
}

interface ArchivioListaProps {
  report: Report[];
  isAdmin: boolean;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

export default function ArchivioLista({ report, isAdmin, onDelete, onView }: ArchivioListaProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDownload = (reportId: number) => {
    window.open(`/api/report/${reportId}/pdf`, '_blank');
  };

  const handleEdit = (reportId: number, tipo: string, impiantoId: number) => {
    const tipoPath = tipo === 'MANUTENZIONE' ? 'manutenzione' : 'intervento';
    window.location.href = `/${tipoPath}/${impiantoId}?reportId=${reportId}`;
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('⚠️ Sei sicuro di voler eliminare questo report?\n\nQuesta operazione è irreversibile e eliminerà anche tutte le foto e il PDF associati.')) {
      return;
    }

    setDeletingId(reportId);
    try {
      const res = await fetch(`/api/report/${reportId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete(reportId);
        alert('✅ Report eliminato con successo');
      } else {
        const data = await res.json();
        alert(`❌ Errore: ${data.error || 'Impossibile eliminare il report'}`);
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('❌ Errore durante eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  if (report.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12">
        <div className="text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nessun report trovato
          </h3>
          <p className="text-gray-600">
            Prova a modificare i filtri di ricerca o crea un nuovo report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {report.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  {r.codice}
                </h3>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    r.tipo === 'MANUTENZIONE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {r.tipo === 'MANUTENZIONE' ? '🔧' : '🧰'}
                  {r.tipo === 'MANUTENZIONE' ? 'Manutenzione' : 'Intervento'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    r.stato === 'COMPLETATO'
                      ? 'bg-green-100 text-green-700'
                      : r.stato === 'IN_LAVORAZIONE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {r.stato === 'COMPLETATO' ? '✅' : r.stato === 'IN_LAVORAZIONE' ? '🔄' : '🟡'}
                  {r.stato === 'COMPLETATO' ? 'Completato' : r.stato === 'IN_LAVORAZIONE' ? 'In Lavorazione' : 'Bozza'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-fit">Impianto:</span>
                  <span className="text-gray-900 truncate">{r.impianto.nome}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-fit">Operatore:</span>
                  <span className="text-gray-900">{r.utente.username}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-fit">Data:</span>
                  <span className="text-gray-900">
                    {new Date(r.creatoIl).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-fit">Attività:</span>
                  <span className="text-gray-900">{r.numAttivita}</span>
                </div>
              </div>

              {r.impianto.proprieta && (
                <div className="mt-2 text-sm text-gray-600">
                  Proprietà: {r.impianto.proprieta}
                </div>
              )}
            </div>

            <div className="flex flex-row md:flex-col gap-2">
              <button
                onClick={() => onView(r.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                title="Visualizza dettagli"
              >
                <Eye size={18} />
                <span className="text-sm font-medium md:hidden lg:inline">Visualizza</span>
              </button>

              {r.stato === 'COMPLETATO' && (
                <button
                  onClick={() => handleDownload(r.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                  title="Scarica PDF"
                >
                  <Download size={18} />
                  <span className="text-sm font-medium md:hidden lg:inline">Scarica</span>
                </button>
              )}

              {(r.stato === 'BOZZA' || r.stato === 'IN_LAVORAZIONE') && (
                <button
                  onClick={() => handleEdit(r.id, r.tipo, r.impiantoId)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
                  title="Modifica bozza"
                >
                  <Edit size={18} />
                  <span className="text-sm font-medium md:hidden lg:inline">Modifica</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Elimina report"
                >
                  {deletingId === r.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  <span className="text-sm font-medium md:hidden lg:inline">Elimina</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
