'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react';

interface Utente {
  id: number;
  username: string;
  ruolo: string;
  attivo: boolean;
}

interface UtenteModalProps {
  utente: Utente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UtenteModal({ utente, onClose, onSuccess }: UtenteModalProps) {
  const isEdit = utente !== null;
  const [formData, setFormData] = useState({
    username: utente?.username || '',
    password: '',
    confirmPassword: '',
    ruolo: utente?.ruolo || 'COLLABORATORE',
    attivo: utente?.attivo ?? true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const validate = () => {
    if (!formData.username || formData.username.trim() === '') {
      setError('Username obbligatorio');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username deve essere almeno 3 caratteri');
      return false;
    }

    if (!isEdit && (!formData.password || formData.password === '')) {
      setError('Password obbligatoria');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password deve essere almeno 6 caratteri');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const url = isEdit ? `/api/utenti/${utente.id}` : '/api/utenti';
      const method = isEdit ? 'PUT' : 'POST';

      const body: {
        username: string;
        ruolo: string;
        attivo: boolean;
        password?: string;
        newPassword?: string;
      } = {
        username: formData.username.trim(),
        ruolo: formData.ruolo,
        attivo: formData.attivo,
      };

      if (!isEdit) {
        body.password = formData.password;
      } else if (formData.password) {
        body.newPassword = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante salvataggio');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Modifica utente' : 'Nuovo utente'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={3}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {!isEdit && '*'}
              {isEdit && (
                <span className="text-gray-500 font-normal ml-1">
                  (lascia vuoto per non cambiare)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={6}
                required={!isEdit}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conferma password {!isEdit && '*'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!isEdit || formData.password !== ''}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ruolo *
            </label>
            <select
              value={formData.ruolo}
              onChange={(e) => setFormData({ ...formData, ruolo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="COLLABORATORE">Collaboratore</option>
              <option value="ADMIN">Amministratore</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Gli amministratori hanno accesso completo al sistema
            </p>
          </div>

          {isEdit && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.attivo}
                  onChange={(e) => setFormData({ ...formData, attivo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Utente attivo</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Gli utenti disattivati non possono accedere al sistema
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {isEdit ? 'Salva modifiche' : 'Crea utente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
