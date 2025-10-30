'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Loader2 } from 'lucide-react';

interface Impianto {
  id: number;
  nome: string;
  proprieta: string | null;
  creatoIl: string;
  creatoUtente: {
    username: string;
  };
}

export default function ImpiantiList({ tipo }: { tipo: 'manutenzione' | 'intervento' }) {
  const [impianti, setImpianti] = useState<Impianto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newProprieta, setNewProprieta] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchImpianti();
  }, [search]);

  const fetchImpianti = async () => {
    setLoading(true);
    const res = await fetch(`/api/impianti?search=${search}`);
    const data = await res.json();
    setImpianti(data);
    setLoading(false);
  };

  const handleCreateImpianto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const res = await fetch('/api/impianti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: newNome, proprieta: newProprieta }),
    });

    const newImpianto = await res.json();
    setCreating(false);
    setShowNewForm(false);
    setNewNome('');
    setNewProprieta('');

    router.push(`/${tipo}/${newImpianto.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Barra ricerca */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cerca impianto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Nuovo impianto
        </button>
      </div>

      {/* Form nuovo impianto */}
      {showNewForm && (
        <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Crea nuovo impianto</h3>
          <form onSubmit={handleCreateImpianto} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome impianto *
              </label>
              <input
                type="text"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proprietà (opzionale)
              </label>
              <input
                type="text"
                value={newProprieta}
                onChange={(e) => setNewProprieta(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {creating ? 'Creazione...' : 'Crea e inizia'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista impianti */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={40} />
        </div>
      ) : impianti.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? 'Nessun impianto trovato' : 'Nessun impianto. Creane uno nuovo!'}
        </div>
      ) : (
        <div className="grid gap-4">
          {impianti.map((impianto) => (
            <button
              key={impianto.id}
              onClick={() => router.push(`/${tipo}/${impianto.id}`)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition text-left"
            >
              <h3 className="font-bold text-lg text-gray-900">{impianto.nome}</h3>
              {impianto.proprieta && (
                <p className="text-gray-600 text-sm mt-1">Proprietà: {impianto.proprieta}</p>
              )}
              <p className="text-gray-400 text-xs mt-2">
                Creato da {impianto.creatoUtente.username} • {new Date(impianto.creatoIl).toLocaleDateString('it-IT')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
