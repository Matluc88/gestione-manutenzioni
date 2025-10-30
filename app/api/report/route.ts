import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generaCodiceReport } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { impiantoId, tipo } = body;

  if (!impiantoId || !tipo) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
  }

  const codice = await generaCodiceReport(tipo);

  const report = await prisma.report.create({
    data: {
      codice,
      tipo,
      stato: 'BOZZA',
      impiantoId: parseInt(impiantoId),
      utenteId: parseInt(session.user.id),
    },
  });

  return NextResponse.json(report, { status: 201 });
}
