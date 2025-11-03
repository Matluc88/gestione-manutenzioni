import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import InterventoForm from '@/components/InterventoForm';

export default async function InterventoImpiantoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { id } = await params;
  const impiantoId = parseInt(id);
  
  if (!Number.isInteger(impiantoId)) {
    redirect('/intervento');
  }

  const impianto = await prisma.impianto.findUnique({
    where: { id: impiantoId },
  });

  if (!impianto) {
    redirect('/intervento');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Intervento tecnico
          </h1>
          <p className="text-gray-600 mt-1">
            Impianto: <span className="font-semibold">{impianto.nome}</span>
            {impianto.proprieta && ` • Proprietà: ${impianto.proprieta}`}
          </p>
        </div>

        <InterventoForm
          impiantoId={impianto.id}
          userId={parseInt(session.user.id)}
        />
      </main>
    </div>
  );
}
