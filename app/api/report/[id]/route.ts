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

  const report = await prisma.report.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      impianto: true,
      utente: {
        select: { username: true },
      },
      attivita: {
        include: {
          componente: true,
        },
        orderBy: { ordine: 'asc' },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: 'Report non trovato' }, { status: 404 });
  }

  return NextResponse.json(report);
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
  const { stato } = body;

  const report = await prisma.report.update({
    where: { id: parseInt(params.id) },
    data: { stato },
  });

  return NextResponse.json(report);
}
