import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function ImpostazioniPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.ruolo !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <p className="text-gray-600 mt-2">Disponibile in Fase 8</p>
      </main>
    </div>
  );
}
