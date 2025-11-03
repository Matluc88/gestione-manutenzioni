import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

type RuoloType = 'ADMIN' | 'COLLABORATORE';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono modificare utenti.' },
      { status: 403 }
    );
  }

  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();
    const { username, newPassword, ruolo, attivo } = body;

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username deve essere almeno 3 caratteri' },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password deve essere almeno 6 caratteri' },
        { status: 400 }
      );
    }

    if (!ruolo || !['ADMIN', 'COLLABORATORE'].includes(ruolo)) {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.utente.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    if (parseInt(session.user.id) === id && attivo === false) {
      return NextResponse.json(
        { error: 'Non puoi disattivare il tuo account' },
        { status: 400 }
      );
    }

    const usernameExists = await prisma.utente.findFirst({
      where: {
        username: username.trim(),
        NOT: { id },
      },
    });

    if (usernameExists) {
      return NextResponse.json(
        { error: 'Username già esistente' },
        { status: 400 }
      );
    }

    const updateData: {
      username: string;
      ruolo: RuoloType;
      attivo: boolean;
      passwordHash?: string;
    } = {
      username: username.trim(),
      ruolo: ruolo as RuoloType,
      attivo: attivo !== undefined ? attivo : existingUser.attivo,
    };

    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const utenteAggiornato = await prisma.utente.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        ruolo: true,
        attivo: true,
        creatoIl: true,
      },
    });

    return NextResponse.json(utenteAggiornato);
  } catch (error) {
    console.error('Errore aggiornamento utente:', error);
    return NextResponse.json(
      { error: 'Errore durante aggiornamento utente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono eliminare utenti.' },
      { status: 403 }
    );
  }

  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    if (parseInt(session.user.id) === id) {
      return NextResponse.json(
        { error: 'Non puoi eliminare il tuo account' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.utente.findUnique({
      where: { id },
      include: {
        report: true,
        impiantiCreati: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    if (existingUser.report.length > 0 || existingUser.impiantiCreati.length > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare utente con report o impianti associati. Disattivalo invece.' },
        { status: 400 }
      );
    }

    await prisma.utente.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione utente:', error);
    return NextResponse.json(
      { error: 'Errore durante eliminazione utente' },
      { status: 500 }
    );
  }
}
