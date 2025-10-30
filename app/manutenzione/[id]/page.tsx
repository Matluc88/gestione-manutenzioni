import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ManutenzioneForm from '@/components/ManutenzioneForm';

export default async function ManutenzioneImpiantoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const impianto = await prisma.impianto.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!impianto) {
    redirect('/manutenzione');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Manutenzione ordinaria
          </h1>
          <p className="text-gray-600 mt-1">
            Impianto: <span className="font-semibold">{impianto.nome}</span>
            {impianto.proprieta && ` • Proprietà: ${impianto.proprieta}`}
          </p>
        </div>

        <ManutenzioneForm
          impiantoId={impianto.id}
          userId={parseInt(session.user.id)}
        />
      </main>
    </div>
  );
}
