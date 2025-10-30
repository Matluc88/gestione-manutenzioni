import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const impianto = await prisma.impianto.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      creatoUtente: {
        select: { username: true },
      },
    },
  });

  if (!impianto) {
    return NextResponse.json({ error: 'Impianto non trovato' }, { status: 404 });
  }

  return NextResponse.json(impianto);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { nome, proprieta } = body;

  const impianto = await prisma.impianto.update({
    where: { id: parseInt(params.id) },
    data: {
      nome,
      proprieta: proprieta || null,
    },
  });

  return NextResponse.json(impianto);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  await prisma.impianto.delete({
    where: { id: parseInt(params.id) },
  });

  return NextResponse.json({ success: true });
}
