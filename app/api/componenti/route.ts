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
  const impiantoId = searchParams.get('impiantoId');

  const where = impiantoId
    ? {
        OR: [
          { predefinito: true },
          { impiantoId: parseInt(impiantoId) },
        ],
      }
    : { predefinito: true };

  const componenti = await prisma.componente.findMany({
    where,
    orderBy: [
      { predefinito: 'desc' },
      { nome: 'asc' },
    ],
  });

  return NextResponse.json(componenti);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { nome, impiantoId, predefinito } = body;

  if (!nome || nome.trim().length === 0) {
    return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
  }

  if (predefinito && session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Solo gli admin possono creare componenti predefiniti' },
      { status: 403 }
    );
  }

  const componente = await prisma.componente.create({
    data: {
      nome: nome.trim(),
      predefinito: predefinito || false,
      impiantoId: impiantoId ? parseInt(impiantoId) : null,
    },
  });

  return NextResponse.json(componente, { status: 201 });
}
