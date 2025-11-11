'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LogoTab from '@/components/LogoTab';
import UtentiTab from '@/components/UtentiTab';
import ComponentiTab from '@/components/ComponentiTab';
import { Building, Image as ImageIcon, Users, Package, Loader2 } from 'lucide-react';

export default function ImpostazioniPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'dati' | 'logo' | 'utenti' | 'componenti'>('dati');
  const [formData, setFormData] = useState({
    nomeAzienda: '',
    indirizzo: '',
    telefono: '',
    email: '',
    partitaIva: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.ruolo !== 'ADMIN')) {
      redirect('/dashboard');
    }
  }, [status, session]);

  useEffect(() => {
    if (session && session.user.ruolo === 'ADMIN') {
      fetchImpostazioni();
    }
  }, [session]);

  const fetchImpostazioni = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/impostazioni');
      const data = await res.json();
      setFormData({
        nomeAzienda: data.nomeAzienda || '',
        indirizzo: data.indirizzo || '',
        telefono: data.telefono || '',
        email: data.email || '',
        partitaIva: data.partitaIva || '',
      });
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/impostazioni', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Errore durante salvataggio');
      }

      setMessage({ type: 'success', text: '✅ Impostazioni salvate con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: '❌ Errore durante salvataggio' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
          <p className="text-gray-600 mt-1">Gestisci i dati aziendali, il logo, gli utenti e i componenti</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('dati')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'dati'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Dati Azienda</span>
                <span className="sm:hidden">Dati</span>
              </button>
              
              <button
                onClick={() => setActiveTab('logo')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'logo'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ImageIcon size={18} className="sm:w-5 sm:h-5" />
                Logo
              </button>
              
              <button
                onClick={() => setActiveTab('utenti')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'utenti'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Gestione Utenti</span>
                <span className="sm:hidden">Utenti</span>
              </button>
              
              <button
                onClick={() => setActiveTab('componenti')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'componenti'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package size={18} className="sm:w-5 sm:h-5" />
                Componenti
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dati' ? (
              <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Azienda
                    </label>
                    <input
                      type="text"
                      value={formData.nomeAzienda}
                      onChange={(e) => setFormData({ ...formData, nomeAzienda: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Es. ONE-M Energy Solutions"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Indirizzo
                    </label>
                    <input
                      type="text"
                      value={formData.indirizzo}
                      onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Es. Via Roma 123, 00100 Roma"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Es. +39 06 1234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Es. info@one-m.it"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      value={formData.partitaIva}
                      onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Es. 05129780754"
                    />
                  </div>

                  {message && (
                    <div
                      className={`p-4 rounded-lg ${
                        message.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Salvataggio...
                        </>
                      ) : (
                        'Salva Modifiche'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : activeTab === 'logo' ? (
              <LogoTab />
            ) : activeTab === 'utenti' ? (
              <UtentiTab />
            ) : (
              <ComponentiTab />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
