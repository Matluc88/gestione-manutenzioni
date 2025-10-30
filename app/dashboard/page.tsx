import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardCard from '@/components/DashboardCard';
import Navbar from '@/components/Navbar';
import { Wrench, Hammer, FolderOpen, Settings } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.ruolo === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Benvenuto, {session.user.username}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard
            icon={<Wrench className="w-12 h-12" />}
            title="Manutenzione ordinaria"
            description="Gestisci manutenzioni con checklist"
            href="/manutenzione"
            color="blue"
          />

          <DashboardCard
            icon={<Hammer className="w-12 h-12" />}
            title="Intervento"
            description="Registra interventi tecnici"
            href="/intervento"
            color="green"
          />

          <DashboardCard
            icon={<FolderOpen className="w-12 h-12" />}
            title="Archivio"
            description="Consulta report precedenti"
            href="/archivio"
            color="purple"
          />

          {isAdmin && (
            <DashboardCard
              icon={<Settings className="w-12 h-12" />}
              title="Impostazioni"
              description="Configurazione sistema (solo admin)"
              href="/impostazioni"
              color="gray"
            />
          )}
        </div>
      </main>
    </div>
  );
}
