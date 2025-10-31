'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Shield, User, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import UtenteModal from './UtenteModal';

interface Utente {
  id: number;
  username: string;
  ruolo: string;
  attivo: boolean;
  creatoIl: string;
}

export default function UtentiTab() {
  const { data: session } = useSession();
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUtente, setEditingUtente] = useState<Utente | null>(null);

  useEffect(() => {
    fetchUtenti();
  }, []);

  const fetchUtenti = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/utenti');
      const data = await res.json();
      setUtenti(data);
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUtente(null);
    setModalOpen(true);
  };

  const handleEdit = (utente: Utente) => {
    setEditingUtente(utente);
    setModalOpen(true);
  };

  const handleDelete = async (utente: Utente) => {
    if (session?.user.id && utente.id === parseInt(session.user.id)) {
      alert('❌ Non puoi eliminare il tuo account!');
      return;
    }

    if (
      !confirm(
        `⚠️ Sei sicuro di voler eliminare l'utente "${utente.username}"?\n\nQuesta operazione è irreversibile.\n\nSe l'utente ha report associati, l'eliminazione fallirà. In tal caso, disattivalo invece.`
      )
    ) {
      return;
    }

    setDeletingId(utente.id);
    try {
      const res = await fetch(`/api/utenti/${utente.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante eliminazione');
      }

      setUtenti(utenti.filter((u) => u.id !== utente.id));
      alert('✅ Utente eliminato con successo');
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAttivo = async (utente: Utente) => {
    if (session?.user.id && utente.id === parseInt(session.user.id)) {
      alert('❌ Non puoi disattivare il tuo account!');
      return;
    }

    const newAttivo = !utente.attivo;
    const action = newAttivo ? 'riattivare' : 'disattivare';

    if (!confirm(`Sei sicuro di voler ${action} l'utente "${utente.username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/utenti/${utente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: utente.username,
          ruolo: utente.ruolo,
          attivo: newAttivo,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante aggiornamento');
      }

      const updated = await res.json();
      setUtenti(utenti.map((u) => (u.id === updated.id ? updated : u)));
      alert(`✅ Utente ${action}to con successo`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUtente(null);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingUtente(null);
    fetchUtenti();
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
            Utenti ({utenti.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestisci gli utenti che possono accedere al sistema
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          <Plus size={20} />
          Nuovo utente
        </button>
      </div>

      {utenti.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <User className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Nessun utente trovato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {utenti.map((utente) => {
            const isCurrentUser = session?.user.id && utente.id === parseInt(session.user.id);
            
            return (
              <div
                key={utente.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition ${
                  !utente.attivo ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">
                        {utente.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-sm text-blue-600">(Tu)</span>
                        )}
                      </h4>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          utente.ruolo === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {utente.ruolo === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
                        {utente.ruolo === 'ADMIN' ? 'Amministratore' : 'Collaboratore'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          utente.attivo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {utente.attivo ? (
                          <>
                            <CheckCircle size={14} />
                            Attivo
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            Disattivato
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      Creato il{' '}
                      {new Date(utente.creatoIl).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(utente)}
                      className="flex items-center gap-1 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-sm font-medium"
                    >
                      <Edit size={16} />
                      Modifica
                    </button>

                    {!isCurrentUser && (
                      <button
                        onClick={() => handleToggleAttivo(utente)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition text-sm font-medium ${
                          utente.attivo
                            ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {utente.attivo ? (
                          <>
                            <XCircle size={16} />
                            Disattiva
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Riattiva
                          </>
                        )}
                      </button>
                    )}

                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDelete(utente)}
                        disabled={deletingId === utente.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-sm font-medium disabled:opacity-50"
                      >
                        {deletingId === utente.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Elimina
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <UtenteModal
          utente={editingUtente}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
