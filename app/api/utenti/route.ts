import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
      where: { attivo: true },
      select: {
        id: true,
        username: true,
        ruolo: true,
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
