'use client';

import { signOut } from 'next-auth/react';
import { LogOut, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user: {
    username: string;
    ruolo: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const handleBack = () => {
    router.back();
  };

  const handleForward = () => {
    if (typeof window !== 'undefined') {
      window.history.forward();
    }
  };

  const handleHome = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Indietro"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleForward}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Avanti"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={handleHome}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Dashboard"
              >
                <Home size={20} />
              </button>
            </div>
            <div className="border-l border-gray-300 h-8"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sistema Angelo</h1>
              <p className="text-sm text-gray-600">
                {user.username} • {user.ruolo === 'ADMIN' ? '👑 Admin' : '👤 Collaboratore'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={20} />
            Esci
          </button>
        </div>
      </nav>

      {/* Dialog conferma logout */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Conferma uscita
            </h2>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler uscire dal sistema?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
