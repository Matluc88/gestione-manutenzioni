'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Plus, Loader2, Edit2, Trash2, X } from 'lucide-react';

interface Impianto {
  id: number;
  nome: string;
  proprieta: string | null;
  inManutenzione: boolean;
  inIntervento: boolean;
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
  const [editingImpianto, setEditingImpianto] = useState<Impianto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchImpianti = async () => {
      setLoading(true);
      const res = await fetch(`/api/impianti?search=${search}&tipo=${tipo}`);
      const data = await res.json();
      setImpianti(data);
      setLoading(false);
    };
    
    fetchImpianti();
  }, [search, tipo]);

  const handleCreateImpianto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const res = await fetch('/api/impianti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nome: newNome, 
        proprieta: newProprieta,
        inManutenzione: tipo === 'manutenzione',
        inIntervento: tipo === 'intervento',
      }),
    });

    const newImpianto = await res.json();
    setCreating(false);
    setShowNewForm(false);
    setNewNome('');
    setNewProprieta('');

    router.push(`/${tipo}/${newImpianto.id}`);
  };

  const handleEditImpianto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImpianto) return;

    const res = await fetch(`/api/impianti/${editingImpianto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: editingImpianto.nome,
        proprieta: editingImpianto.proprieta,
        inManutenzione: editingImpianto.inManutenzione,
        inIntervento: editingImpianto.inIntervento,
      }),
    });

    if (res.ok) {
      setEditingImpianto(null);
      const fetchRes = await fetch(`/api/impianti?search=${search}&tipo=${tipo}`);
      const data = await fetchRes.json();
      setImpianti(data);
    }
  };

  const handleDeleteImpianto = async (id: number) => {
    const res = await fetch(`/api/impianti/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setDeletingId(null);
      const fetchRes = await fetch(`/api/impianti?search=${search}&tipo=${tipo}`);
      const data = await fetchRes.json();
      setImpianti(data);
    } else {
      alert('Errore durante l\'eliminazione. L\'impianto potrebbe essere referenziato da report esistenti.');
      setDeletingId(null);
    }
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
            <div
              key={impianto.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <button
                  onClick={() => router.push(`/${tipo}/${impianto.id}`)}
                  className="flex-1 text-left"
                >
                  <h3 className="font-bold text-lg text-gray-900">{impianto.nome}</h3>
                  {impianto.proprieta && (
                    <p className="text-gray-600 text-sm mt-1">Proprietà: {impianto.proprieta}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    Creato da {impianto.creatoUtente.username} • {new Date(impianto.creatoIl).toLocaleDateString('it-IT')}
                  </p>
                </button>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingImpianto(impianto);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Modifica"
                  >
                    <Edit2 size={18} />
                  </button>
                  {(session?.user?.ruolo === 'ADMIN' || impianto.creatoUtente.username === session?.user?.username) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(impianto.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal modifica impianto */}
      {editingImpianto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Modifica impianto</h2>
              <button
                onClick={() => setEditingImpianto(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditImpianto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome impianto *
                </label>
                <input
                  type="text"
                  value={editingImpianto.nome}
                  onChange={(e) => setEditingImpianto({ ...editingImpianto, nome: e.target.value })}
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
                  value={editingImpianto.proprieta || ''}
                  onChange={(e) => setEditingImpianto({ ...editingImpianto, proprieta: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sezioni
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingImpianto.inManutenzione}
                      onChange={(e) => setEditingImpianto({ ...editingImpianto, inManutenzione: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Manutenzione Ordinaria</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingImpianto.inIntervento}
                      onChange={(e) => setEditingImpianto({ ...editingImpianto, inIntervento: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Intervento Tecnico</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingImpianto(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Salva modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal conferma eliminazione */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Conferma eliminazione
            </h2>
            <p className="text-gray-600 mb-6">
              <strong>Attenzione:</strong> Eliminando l&apos;impianto si elimineranno anche tutti i report associati. Proseguire?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDeleteImpianto(deletingId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
