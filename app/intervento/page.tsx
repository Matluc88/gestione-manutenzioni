import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ImpiantiList from '@/components/ImpiantiList';

export default async function InterventoSelectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Intervento tecnico
        </h1>
        <p className="text-gray-600 mb-8">
          Seleziona un impianto per registrare un intervento
        </p>

        <ImpiantiList tipo="intervento" />
      </main>
    </div>
  );
}
