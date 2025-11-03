import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const tipo = searchParams.get('tipo') as 'manutenzione' | 'intervento' | null;

  const whereClause: any = {
    nome: {
      contains: search,
      mode: 'insensitive',
    },
  };

  if (tipo === 'manutenzione') {
    whereClause.inManutenzione = true;
  } else if (tipo === 'intervento') {
    whereClause.inIntervento = true;
  }

  const impianti = await prisma.impianto.findMany({
    where: whereClause,
    include: {
      creatoUtente: {
        select: { username: true },
      },
    },
    orderBy: { creatoIl: 'desc' },
  });

  return NextResponse.json(impianti);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { nome, proprieta, inManutenzione, inIntervento } = body;

  if (!nome) {
    return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
  }

  const impianto = await prisma.impianto.create({
    data: {
      nome,
      proprieta: proprieta || null,
      inManutenzione: inManutenzione !== undefined ? inManutenzione : true,
      inIntervento: inIntervento !== undefined ? inIntervento : true,
      creatoId: parseInt(session.user.id),
    },
  });

  return NextResponse.json(impianto, { status: 201 });
}
