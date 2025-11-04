import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono accedere alle impostazioni.' },
      { status: 403 }
    );
  }

  try {
    let impostazioni = await prisma.impostazioni.findUnique({
      where: { id: 1 },
    });

    if (!impostazioni) {
      impostazioni = await prisma.impostazioni.create({
        data: {
          id: 1,
        },
      });
    }

    return NextResponse.json(impostazioni);
  } catch (error) {
    console.error('Errore caricamento impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore durante caricamento impostazioni' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono modificare le impostazioni.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { nomeAzienda, indirizzo, telefono, email, partitaIva } = body;

    const impostazioni = await prisma.impostazioni.upsert({
      where: { id: 1 },
      update: {
        nomeAzienda,
        indirizzo,
        telefono,
        email,
        partitaIva,
      },
      create: {
        id: 1,
        nomeAzienda,
        indirizzo,
        telefono,
        email,
        partitaIva,
        logoPath: null,
      },
    });

    return NextResponse.json(impostazioni);
  } catch (error) {
    console.error('Errore aggiornamento impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore durante aggiornamento impostazioni' },
      { status: 500 }
    );
  }
}
