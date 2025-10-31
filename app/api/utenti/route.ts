import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono vedere la lista utenti.' },
      { status: 403 }
    );
  }

  try {
    const utenti = await prisma.utente.findMany({
      select: {
        id: true,
        username: true,
        ruolo: true,
        attivo: true,
        creatoIl: true,
      },
      orderBy: { username: 'asc' },
    });

    return NextResponse.json(utenti);
  } catch (error) {
    console.error('Errore lista utenti:', error);
    return NextResponse.json(
      { error: 'Errore durante caricamento utenti' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono creare utenti.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { username, password, ruolo, attivo } = body;

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username deve essere almeno 3 caratteri' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
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
      where: { username: username.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username già esistente' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuovoUtente = await prisma.utente.create({
      data: {
        username: username.trim(),
        passwordHash,
        ruolo,
        attivo: attivo !== undefined ? attivo : true,
      },
      select: {
        id: true,
        username: true,
        ruolo: true,
        attivo: true,
        creatoIl: true,
      },
    });

    return NextResponse.json(nuovoUtente, { status: 201 });
  } catch (error) {
    console.error('Errore creazione utente:', error);
    return NextResponse.json(
      { error: 'Errore durante creazione utente' },
      { status: 500 }
    );
  }
}
