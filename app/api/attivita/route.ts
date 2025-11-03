import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { reportId, componenteId, descrizione, stato, motivazione, note, ordine } = body;

  if (stato === 'NON_FATTO' && !motivazione) {
    return NextResponse.json(
      { error: 'Motivazione obbligatoria per stato NON_FATTO' },
      { status: 400 }
    );
  }

  const attivita = await prisma.attivita.create({
    data: {
      reportId: parseInt(reportId),
      componenteId: componenteId ? parseInt(componenteId) : null,
      descrizione,
      stato,
      motivazione: stato === 'NON_FATTO' ? motivazione : null,
      note: note || null,
      ordine: ordine || 0,
    },
  });

  return NextResponse.json(attivita, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { id, descrizione, stato, motivazione, note } = body;

  if (stato === 'NON_FATTO' && !motivazione) {
    return NextResponse.json(
      { error: 'Motivazione obbligatoria per stato NON_FATTO' },
      { status: 400 }
    );
  }

  const attivita = await prisma.attivita.update({
    where: { id: parseInt(id) },
    data: {
      descrizione,
      stato,
      motivazione: stato === 'NON_FATTO' ? motivazione : null,
      note: note || null,
    },
  });

  return NextResponse.json(attivita);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
  }

  await prisma.attivita.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}
