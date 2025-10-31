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
  stato: 'FATTO' | 'NON_FATTO' | 'NON_APPLICABILE';
  motivazione: string;
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

  const aggiungiAttivita = () => {
    setAttivita([
      ...attivita,
      {
        descrizione: '',
        stato: 'FATTO',
        motivazione: '',
        note: '',
        foto: [],
      },
    ]);
  };

  const updateAttivita = (index: number, field: keyof Attivita, value: string) => {
    const newAttivita = [...attivita];
    newAttivita[index] = { ...newAttivita[index], [field]: value };
    
    if (field === 'stato' && value !== 'NON_FATTO') {
      newAttivita[index].motivazione = '';
    }
    
    setAttivita(newAttivita);
  };

  const removeAttivita = (index: number) => {
    setAttivita(attivita.filter((_, i) => i !== index));
  };

  const salvaAttivita = async () => {
    if (!reportId) return;

    for (let i = 0; i < attivita.length; i++) {
      const att = attivita[i];
      
      if (!att.descrizione) {
        alert('Descrizione obbligatoria per tutte le attività');
        return;
      }
      
      if (att.stato === 'NON_FATTO' && !att.motivazione) {
        alert('Motivazione obbligatoria per attività non fatte');
        return;
      }

      if ((att.stato === 'FATTO' || att.stato === 'NON_FATTO') && att.foto.length === 0) {
        alert(`Foto obbligatoria per attività: ${att.descrizione}`);
        return;
      }

      if (att.id) {
        await fetch('/api/attivita', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: att.id,
            descrizione: att.descrizione,
            stato: att.stato,
            motivazione: att.motivazione,
            note: att.note,
          }),
        });
      } else {
        const res = await fetch('/api/attivita', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId,
            componenteId: null,
            descrizione: att.descrizione,
            stato: att.stato,
            motivazione: att.motivazione,
            note: att.note,
            ordine: i,
          }),
        });
        
        const newAtt = await res.json();
        
        const newAttivita = [...attivita];
        newAttivita[i].id = newAtt.id;
        setAttivita(newAttivita);
      }
    }
  };

  const handleSalvaBozza = async () => {
    setSaving(true);
    await salvaAttivita();
    setSaving(false);
    alert('Bozza salvata con successo!');
    router.push('/dashboard');
  };

  const handleGeneraPDF = async () => {
    if (attivita.length === 0) {
      alert('Inserisci almeno un\'attività prima di generare il PDF');
      return;
    }

    setGenerating(true);
    await salvaAttivita();
    
    if (reportId) {
      await fetch(`/api/report/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'COMPLETATO' }),
      });
    }
    
    setGenerating(false);
    alert('Report completato! Puoi scaricarlo dall\'archivio.');
    router.push('/archivio');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Attività intervento</h2>
        
        <button
          onClick={aggiungiAttivita}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Inserisci attività
        </button>
      </div>

      {attivita.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Attività ({attivita.length})</h2>
          
          {attivita.map((att, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">Attività {index + 1}</h3>
                <button
                  onClick={() => removeAttivita(index)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 size={18} />
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
                  placeholder="Descrivi l'intervento effettuato..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stato *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => updateAttivita(index, 'stato', 'FATTO')}
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      att.stato === 'FATTO'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    ✅ Fatto
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAttivita(index, 'stato', 'NON_FATTO')}
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      att.stato === 'NON_FATTO'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-500'
                    }`}
                  >
                    ❌ Non fatto
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAttivita(index, 'stato', 'NON_APPLICABILE')}
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      att.stato === 'NON_APPLICABILE'
                        ? 'border-gray-500 bg-gray-50 text-gray-700'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    ⚪ Non applicabile
                  </button>
                </div>
              </div>

              {att.stato === 'NON_FATTO' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivazione * (obbligatorio)
                  </label>
                  <textarea
                    value={att.motivazione}
                    onChange={(e) => updateAttivita(index, 'motivazione', e.target.value)}
                    placeholder="Spiega perché l'intervento non è stato completato..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (facoltativo)
                </label>
                <textarea
                  value={att.note}
                  onChange={(e) => updateAttivita(index, 'note', e.target.value)}
                  placeholder="Note aggiuntive sull'intervento..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {att.stato !== 'NON_APPLICABILE' && (
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
                  required={att.stato === 'FATTO' || att.stato === 'NON_FATTO'}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {attivita.length > 0 && (
        <div className="flex gap-4 sticky bottom-4">
          <button
            onClick={handleSalvaBozza}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition shadow-lg"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Salva bozza
          </button>
          
          <button
            onClick={handleGeneraPDF}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition shadow-lg"
          >
            {generating ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
            Fine attività → Genera PDF
          </button>
        </div>
      )}
    </div>
  );
}
