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

  const impianti = await prisma.impianto.findMany({
    where: {
      nome: {
        contains: search,
        mode: 'insensitive',
      },
    },
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
  const { nome, proprieta } = body;

  if (!nome) {
    return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
  }

  const impianto = await prisma.impianto.create({
    data: {
      nome,
      proprieta: proprieta || null,
      creatoId: parseInt(session.user.id),
    },
  });

  return NextResponse.json(impianto, { status: 201 });
}
