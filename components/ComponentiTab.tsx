'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Package, X } from 'lucide-react';

interface Componente {
  id: number;
  nome: string;
  predefinito: boolean;
}

export default function ComponentiTab() {
  const [componenti, setComponenti] = useState<Componente[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingComponente, setEditingComponente] = useState<Componente | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchComponenti();
  }, []);

  const fetchComponenti = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/componenti');
      const data = await res.json();
      const predefiniti = data.filter((c: Componente) => c.predefinito);
      setComponenti(predefiniti);
    } catch (error) {
      console.error('Errore caricamento componenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/componenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newNome.trim(),
          predefinito: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante creazione');
      }

      setNewNome('');
      setShowCreateForm(false);
      fetchComponenti();
      alert('✅ Componente creato con successo');
    } catch (error) {
      alert(`❌ ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComponente || !editingComponente.nome.trim()) return;

    try {
      const res = await fetch(`/api/componenti/${editingComponente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editingComponente.nome.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante aggiornamento');
      }

      setEditingComponente(null);
      fetchComponenti();
      alert('✅ Componente aggiornato con successo');
    } catch (error) {
      alert(`❌ ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  const handleDelete = async (componente: Componente) => {
    if (
      !confirm(
        `⚠️ Sei sicuro di voler eliminare il componente "${componente.nome}"?\n\nQuesta operazione è irreversibile.`
      )
    ) {
      return;
    }

    setDeletingId(componente.id);
    try {
      const res = await fetch(`/api/componenti/${componente.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante eliminazione');
      }

      fetchComponenti();
      alert('✅ Componente eliminato con successo');
    } catch (error) {
      alert(`❌ ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setDeletingId(null);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Componenti Predefiniti ({componenti.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestisci i componenti che appaiono nel menù a tendina durante la creazione delle attività
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          <Plus size={20} />
          Nuovo componente
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white border-2 border-green-500 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-900">Crea nuovo componente</h4>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewNome('');
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome componente *
              </label>
              <input
                type="text"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Es. Pannello Fotovoltaico"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewNome('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={creating || !newNome.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {creating ? 'Creazione...' : 'Crea componente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {componenti.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 mb-2">Nessun componente predefinito</p>
          <p className="text-sm text-gray-500">
            Crea componenti predefiniti per velocizzare la creazione delle attività
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {componenti.map((componente) => (
            <div
              key={componente.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Package className="text-gray-400" size={20} />
                  <h4 className="font-semibold text-lg text-gray-900">
                    {componente.nome}
                  </h4>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingComponente(componente)}
                    className="flex items-center gap-1 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-sm font-medium"
                  >
                    <Edit size={16} />
                    Modifica
                  </button>

                  <button
                    onClick={() => handleDelete(componente)}
                    disabled={deletingId === componente.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === componente.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingComponente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Modifica componente</h2>
              <button
                onClick={() => setEditingComponente(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome componente *
                </label>
                <input
                  type="text"
                  value={editingComponente.nome}
                  onChange={(e) =>
                    setEditingComponente({ ...editingComponente, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingComponente(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!editingComponente.nome.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  Salva modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
