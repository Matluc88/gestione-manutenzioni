'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface Impianto {
  id: number;
  nome: string;
}

interface Utente {
  id: number;
  username: string;
  ruolo: string;
}

interface FiltriValues {
  search: string;
  impiantoId: string;
  utenteId: string;
  tipo: string;
  stato: string;
  dataInizio: string;
  dataFine: string;
}

interface ArchivioFiltriProps {
  filtri: FiltriValues;
  onChange: (filtri: FiltriValues) => void;
  isAdmin: boolean;
  hideTipoFilter?: boolean;
}

export default function ArchivioFiltri({ filtri, onChange, isAdmin, hideTipoFilter = false }: ArchivioFiltriProps) {
  const [impianti, setImpianti] = useState<Impianto[]>([]);
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const impiantiRes = await fetch('/api/impianti');
      const impiantiData = await impiantiRes.json();
      setImpianti(impiantiData);

      if (isAdmin) {
        const utentiRes = await fetch('/api/utenti');
        const utentiData = await utentiRes.json();
        setUtenti(utentiData);
      }
    } catch (error) {
      console.error('Errore caricamento dati filtri:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFiltro = (key: string, value: string) => {
    onChange({ ...filtri, [key]: value });
  };

  const resetFiltri = () => {
    onChange({
      search: '',
      impiantoId: '',
      utenteId: '',
      tipo: '',
      stato: '',
      dataInizio: '',
      dataFine: '',
    });
  };

  const hasActiveFiltri = Object.values(filtri).some((v) => v !== '');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cerca per codice report o nome impianto..."
            value={filtri.search}
            onChange={(e) => updateFiltro('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            showFilters
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter size={20} />
          {showFilters ? 'Nascondi filtri' : 'Filtri avanzati'}
        </button>

        {hasActiveFiltri && (
          <button
            onClick={resetFiltri}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
            title="Azzera tutti i filtri"
          >
            <X size={20} />
            Reset
          </button>
        )}
      </div>

      {showFilters && (
        <div className="pt-4 border-t border-gray-200">
          {loading ? (
            <div className="text-center py-4 text-gray-500">
              Caricamento filtri...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impianto
                </label>
                <select
                  value={filtri.impiantoId}
                  onChange={(e) => updateFiltro('impiantoId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tutti gli impianti</option>
                  {impianti.map((imp) => (
                    <option key={imp.id} value={imp.id}>
                      {imp.nome}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operatore
                  </label>
                  <select
                    value={filtri.utenteId}
                    onChange={(e) => updateFiltro('utenteId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tutti gli operatori</option>
                    {utenti.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} {user.ruolo === 'ADMIN' ? '(Admin)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!hideTipoFilter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo report
                  </label>
                  <select
                    value={filtri.tipo}
                    onChange={(e) => updateFiltro('tipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tutti i tipi</option>
                    <option value="MANUTENZIONE">🔧 Manutenzione</option>
                    <option value="INTERVENTO">🧰 Intervento</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stato
                </label>
                <select
                  value={filtri.stato}
                  onChange={(e) => updateFiltro('stato', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tutti gli stati</option>
                  <option value="BOZZA">🟡 Bozza</option>
                  <option value="IN_LAVORAZIONE">🔄 In Lavorazione</option>
                  <option value="COMPLETATO">✅ Completato</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da
                </label>
                <input
                  type="date"
                  value={filtri.dataInizio}
                  onChange={(e) => updateFiltro('dataInizio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data a
                </label>
                <input
                  type="date"
                  value={filtri.dataFine}
                  onChange={(e) => updateFiltro('dataFine', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {hasActiveFiltri && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Filtri attivi:</span>
                {filtri.search && ` • Ricerca: "${filtri.search}"`}
                {filtri.impiantoId && ` • Impianto selezionato`}
                {filtri.utenteId && ` • Operatore selezionato`}
                {filtri.tipo && ` • Tipo: ${filtri.tipo}`}
                {filtri.stato && ` • Stato: ${filtri.stato}`}
                {filtri.dataInizio && ` • Da: ${new Date(filtri.dataInizio).toLocaleDateString('it-IT')}`}
                {filtri.dataFine && ` • A: ${new Date(filtri.dataFine).toLocaleDateString('it-IT')}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
