import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono modificare i componenti.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { nome } = body;

    if (!nome || nome.trim().length === 0) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
    }

    const componente = await prisma.componente.update({
      where: { id: parseInt(id) },
      data: { nome: nome.trim() },
    });

    return NextResponse.json(componente);
  } catch (error) {
    console.error('Errore aggiornamento componente:', error);
    return NextResponse.json(
      { error: 'Errore durante aggiornamento componente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono eliminare i componenti.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const componenteId = parseInt(id);

    const componente = await prisma.componente.findUnique({
      where: { id: componenteId },
      select: { predefinito: true },
    });

    if (!componente) {
      return NextResponse.json({ error: 'Componente non trovato' }, { status: 404 });
    }

    if (!componente.predefinito) {
      return NextResponse.json(
        { error: 'Puoi eliminare solo componenti predefiniti da questa pagina' },
        { status: 400 }
      );
    }

    await prisma.componente.delete({
      where: { id: componenteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione componente:', error);
    return NextResponse.json(
      { error: 'Errore durante eliminazione componente' },
      { status: 500 }
    );
  }
}
