'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import FotoUpload from './FotoUpload';

interface Componente {
  id: number;
  nome: string;
  predefinito: boolean;
}

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
  componenteId: number | null;
  foto: Foto[];
}

export default function InterventoForm({
  impiantoId,
}: {
  impiantoId: number;
  userId: number;
}) {
  const [componenti, setComponenti] = useState<Componente[]>([]);
  const [componenteSelezionato, setComponenteSelezionato] = useState<number | null>(null);
  const [showNewComponente, setShowNewComponente] = useState(false);
  const [newComponenteNome, setNewComponenteNome] = useState('');
  
  const [attivita, setAttivita] = useState<Attivita[]>([]);
  const [reportId, setReportId] = useState<number | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchComponenti = async () => {
      const res = await fetch(`/api/componenti?impiantoId=${impiantoId}`);
      const data = await res.json();
      setComponenti(data);
    };

    const createOrLoadReport = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reportIdFromUrl = urlParams.get('reportId');
      
      if (reportIdFromUrl) {
        const detailRes = await fetch(`/api/report/${reportIdFromUrl}`);
        const reportDetail = await detailRes.json();
        
        setReportId(reportDetail.id);
        
        if (reportDetail.attivita && reportDetail.attivita.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedAttivita = reportDetail.attivita.map((att: any) => ({
            id: att.id,
            descrizione: att.descrizione,
            stato: att.stato,
            motivazione: att.motivazione || '',
            note: att.note || '',
            componenteId: att.componenteId,
            foto: att.foto || [],
          }));
          setAttivita(loadedAttivita);
          setExpandedActivities(new Set([loadedAttivita.length - 1]));
        }
        return;
      }
      
      let res = await fetch(`/api/report?impiantoId=${impiantoId}&tipo=INTERVENTO&stato=IN_LAVORAZIONE&limit=1`);
      let data = await res.json();
      
      let existingReport = data.report && data.report.length > 0 ? data.report[0] : null;
      
      if (!existingReport) {
        res = await fetch(`/api/report?impiantoId=${impiantoId}&tipo=INTERVENTO&stato=BOZZA&limit=1`);
        data = await res.json();
        existingReport = data.report && data.report.length > 0 ? data.report[0] : null;
      }
      
      if (existingReport) {
        const detailRes = await fetch(`/api/report/${existingReport.id}`);
        const reportDetail = await detailRes.json();
        
        setReportId(reportDetail.id);
        
        if (reportDetail.attivita && reportDetail.attivita.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedAttivita = reportDetail.attivita.map((att: any) => ({
            id: att.id,
            descrizione: att.descrizione,
            stato: att.stato,
            motivazione: att.motivazione || '',
            note: att.note || '',
            componenteId: att.componenteId,
            foto: att.foto || [],
          }));
          setAttivita(loadedAttivita);
          setExpandedActivities(new Set([loadedAttivita.length - 1]));
        }
      } else {
        const createRes = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            impiantoId,
            tipo: 'INTERVENTO',
          }),
        });
        const newReport = await createRes.json();
        setReportId(newReport.id);
      }
    };

    fetchComponenti();
    createOrLoadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddComponente = async () => {
    const res = await fetch('/api/componenti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: newComponenteNome,
        impiantoId,
      }),
    });
    const newComp = await res.json();
    setComponenti([...componenti, newComp]);
    setComponenteSelezionato(newComp.id);
    setNewComponenteNome('');
    setShowNewComponente(false);
    aggiungiAttivita(newComp.id);
  };

  const aggiungiAttivita = async (compId?: number) => {
    if (!reportId) {
      alert('Errore: nessun report attivo');
      return;
    }

    const res = await fetch('/api/attivita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId,
        componenteId: compId || componenteSelezionato,
        descrizione: 'Nuova attività',
        stato: 'FATTO',
        motivazione: null,
        note: null,
        ordine: attivita.length,
      }),
    });

    const newAtt = await res.json();

    const newAttivita: Attivita[] = [
      ...attivita,
      {
        id: newAtt.id,
        descrizione: 'Nuova attività',
        stato: 'FATTO' as const,
        motivazione: '',
        note: '',
        componenteId: compId || componenteSelezionato,
        foto: [],
      },
    ];
    
    setAttivita(newAttivita);
    setExpandedActivities(new Set([newAttivita.length - 1]));
    
    setTimeout(() => {
      const element = document.getElementById(`attivita-${newAttivita.length - 1}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const updateAttivita = (index: number, field: keyof Attivita, value: string) => {
    const newAttivita = [...attivita];
    newAttivita[index] = { ...newAttivita[index], [field]: value };
    
    if (field === 'stato' && value !== 'NON_FATTO') {
      newAttivita[index].motivazione = '';
    }
    
    setAttivita(newAttivita);
  };

  const removeAttivita = async (index: number) => {
    const att = attivita[index];
    
    if (att.id) {
      const response = await fetch(`/api/attivita/${att.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        alert('Errore durante l\'eliminazione dell\'attività. Riprova.');
        return;
      }
    }
    
    const newAttivita = attivita.filter((_, i) => i !== index);
    setAttivita(newAttivita);
    
    const newExpanded = new Set<number>();
    expandedActivities.forEach(idx => {
      if (idx < index) {
        newExpanded.add(idx);
      } else if (idx > index) {
        newExpanded.add(idx - 1);
      }
    });
    
    if (newExpanded.size === 0 && newAttivita.length > 0) {
      newExpanded.add(newAttivita.length - 1);
    }
    
    setExpandedActivities(newExpanded);
  };
  
  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedActivities(newExpanded);
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
            componenteId: att.componenteId,
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
    
    if (reportId) {
      await fetch(`/api/report/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'IN_LAVORAZIONE' }),
      });
    }
    
    setSaving(false);
    alert('✅ Bozza salvata con successo!');
  };

  const handleGeneraPDF = async () => {
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
    router.push('/archivio/intervento');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Seleziona componente</h2>
        
        <div className="flex gap-4 mb-4">
          <select
            value={componenteSelezionato || ''}
            onChange={(e) => setComponenteSelezionato(parseInt(e.target.value))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Scegli componente --</option>
            {componenti.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.nome} {comp.predefinito ? '' : '(Custom)'}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowNewComponente(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Plus size={20} />
            Nuovo componente
          </button>
        </div>

        {showNewComponente && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <input
              type="text"
              placeholder="Nome componente..."
              value={newComponenteNome}
              onChange={(e) => setNewComponenteNome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewComponente(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
              >
                Annulla
              </button>
              <button
                onClick={handleAddComponente}
                disabled={!newComponenteNome}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Aggiungi
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => aggiungiAttivita()}
          disabled={!componenteSelezionato}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          <Plus size={20} />
          Aggiungi attività
        </button>
      </div>

      {attivita.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Attività</h2>
          
          {attivita.map((att, index) => {
            const isExpanded = expandedActivities.has(index);
            const componenteNome = componenti.find(c => c.id === att.componenteId)?.nome || 'N/A';
            
            return (
              <div 
                key={index} 
                id={`attivita-${index}`}
                className={`bg-white rounded-lg border-2 transition-all ${
                  isExpanded ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-semibold text-lg">#{index + 1}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{att.descrizione}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Componente:</span> {componenteNome}
                          {' • '}
                          <span className={`font-medium ${
                            att.stato === 'FATTO' ? 'text-green-600' : 
                            att.stato === 'NON_FATTO' ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {att.stato === 'FATTO' ? '✅ Fatto' : 
                             att.stato === 'NON_FATTO' ? '❌ Non fatto' : 
                             '⚪ Non applicabile'}
                          </span>
                          {att.foto.length > 0 && (
                            <>
                              {' • '}
                              <span>📷 {att.foto.length} foto</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttivita(index);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1 hover:bg-red-50 rounded"
                      >
                        Rimuovi
                      </button>
                      {isExpanded ? (
                        <ChevronUp size={24} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={24} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrizione attività *
                      </label>
                      <input
                        type="text"
                        value={att.descrizione}
                        onChange={(e) => updateAttivita(index, 'descrizione', e.target.value)}
                        placeholder="Es: Controllo cablaggi, Pulizia filtri..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          placeholder="Spiega perché l'attività non è stata completata..."
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
                        placeholder="Note aggiuntive..."
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
                )}
              </div>
            );
          })}
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
            Genera report PDF
          </button>
        </div>
      )}
    </div>
  );
}
