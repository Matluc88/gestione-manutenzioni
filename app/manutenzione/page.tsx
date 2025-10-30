import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ImpiantiList from '@/components/ImpiantiList';

export default async function ManutenzioneSelectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manutenzione ordinaria
        </h1>
        <p className="text-gray-600 mb-8">
          Seleziona un impianto esistente o creane uno nuovo
        </p>

        <ImpiantiList tipo="manutenzione" />
      </main>
    </div>
  );
}
