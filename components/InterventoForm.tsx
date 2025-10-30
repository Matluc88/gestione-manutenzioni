'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, FileText, Loader2, Trash2 } from 'lucide-react';
import FotoUpload from './FotoUpload';

interface Foto {
  id: number;
  filePath: string;
  fileName: string;
}

interface Attivita {
  id?: number;
  descrizione: string;
  note: string;
  foto: Foto[];
}

export default function InterventoForm({
  impiantoId,
}: {
  impiantoId: number;
  userId: number;
}) {
  const [attivita, setAttivita] = useState<Attivita[]>([]);
  const [reportId, setReportId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const createOrLoadReport = async () => {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impiantoId,
          tipo: 'INTERVENTO',
        }),
      });
      const report = await res.json();
      setReportId(report.id);
    };

    createOrLoadReport();
  }, [impiantoId]);

  const aggiungiAttivita = async () => {
    if (!reportId) {
      alert('Errore: nessun report attivo');
      return;
    }

    const res = await fetch('/api/attivita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId,
        componenteId: null,
        descrizione: 'Descrivi l\'intervento...',
        stato: 'FATTO',
        motivazione: null,
        note: null,
        ordine: attivita.length,
      }),
    });

    const newAtt = await res.json();

    setAttivita([
      ...attivita,
      {
        id: newAtt.id,
        descrizione: '',
        note: '',
        foto: [],
      },
    ]);
  };

  const updateAttivita = (index: number, field: keyof Attivita, value: string) => {
    const newAttivita = [...attivita];
    newAttivita[index] = { ...newAttivita[index], [field]: value };
    setAttivita(newAttivita);
  };

  const removeAttivita = async (index: number) => {
    if (!confirm('Eliminare questa attività?')) return;

    const att = attivita[index];
    
    if (att.id) {
      await fetch(`/api/attivita/${att.id}`, {
        method: 'DELETE',
      });
    }

    setAttivita(attivita.filter((_, i) => i !== index));
  };

  const salvaAttivita = async () => {
    if (!reportId) return;

    for (let i = 0; i < attivita.length; i++) {
      const att = attivita[i];

      if (!att.descrizione || att.descrizione.trim() === '' || att.descrizione === 'Descrivi l\'intervento...') {
        alert('Descrizione obbligatoria per tutte le attività');
        return;
      }

      if (att.foto.length === 0) {
        alert(`Almeno una foto obbligatoria per: ${att.descrizione}`);
        return;
      }

      if (att.id) {
        await fetch('/api/attivita', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: att.id,
            descrizione: att.descrizione,
            stato: 'FATTO',
            motivazione: null,
            note: att.note || null,
          }),
        });
      }
    }
  };

  const handleSalvaBozza = async () => {
    if (attivita.length === 0) {
      alert('Aggiungi almeno un\'attività prima di salvare');
      return;
    }

    setSaving(true);
    await salvaAttivita();
    setSaving(false);
    alert('Bozza salvata con successo!');
    router.push('/dashboard');
  };

  const handleFineAttivita = async () => {
    if (attivita.length === 0) {
      alert('Aggiungi almeno un\'attività prima di generare il report');
      return;
    }

    if (!reportId) {
      alert('Errore: nessun report attivo');
      return;
    }

    setGenerating(true);

    try {
      await salvaAttivita();

      const res = await fetch(`/api/report/${reportId}/pdf`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore generazione PDF');
      }

      alert('✅ Intervento completato e PDF generato con successo!');

      window.open(`/api/report/${reportId}/pdf`, '_blank');

      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      alert(`Errore: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Intervento tecnico:</strong> Aggiungi liberamente tutte le attività svolte durante l&apos;intervento. 
          Ogni attività richiede descrizione dettagliata e almeno una foto.
        </p>
      </div>

      <button
        onClick={aggiungiAttivita}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md"
      >
        <Plus size={24} />
        Inserisci attività
      </button>

      {attivita.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Attività ({attivita.length})</h2>

          {attivita.map((att, index) => (
            <div key={att.id || index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-gray-900">
                  Attività {index + 1}
                </h3>
                <button
                  onClick={() => removeAttivita(index)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm hover:bg-red-50 px-3 py-1 rounded transition"
                >
                  <Trash2 size={16} />
                  Rimuovi
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione intervento *
                </label>
                <textarea
                  value={att.descrizione}
                  onChange={(e) => updateAttivita(index, 'descrizione', e.target.value)}
                  placeholder="Descrivi dettagliatamente l'intervento eseguito..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note aggiuntive (facoltativo)
                </label>
                <textarea
                  value={att.note}
                  onChange={(e) => updateAttivita(index, 'note', e.target.value)}
                  placeholder="Note, osservazioni, raccomandazioni..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <FotoUpload
                attivitaId={att.id || null}
                foto={att.foto}
                onFotoAdded={(foto) => {
                  const newAttivita = [...attivita];
                  newAttivita[index].foto.push(foto);
                  setAttivita(newAttivita);
                }}
                onFotoRemoved={(fotoId) => {
                  const newAttivita = [...attivita];
                  newAttivita[index].foto = newAttivita[index].foto.filter(
                    (f) => f.id !== fotoId
                  );
                  setAttivita(newAttivita);
                }}
                required={true}
              />
            </div>
          ))}
        </div>
      )}

      {attivita.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Nessuna attività inserita.</p>
          <p className="text-sm mt-2">Clicca &quot;Inserisci attività&quot; per iniziare.</p>
        </div>
      )}

      {attivita.length > 0 && (
        <div className="flex gap-4 sticky bottom-4 bg-gray-50 py-4 -mx-4 px-4 border-t border-gray-200">
          <button
            onClick={handleSalvaBozza}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition shadow-lg"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salva bozza
          </button>

          <button
            onClick={handleFineAttivita}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition shadow-lg"
          >
            {generating ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            Fine attività → Genera PDF
          </button>
        </div>
      )}
    </div>
  );
}
