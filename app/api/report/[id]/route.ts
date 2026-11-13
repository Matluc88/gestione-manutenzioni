import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id: parseInt(id) },
    include: {
      impianto: true,
      utente: {
        select: { username: true },
      },
      attivita: {
        include: {
          componente: true,
          foto: true,
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { stato, dataIntervento } = body;

  const data: { stato?: 'BOZZA' | 'IN_LAVORAZIONE' | 'COMPLETATO'; dataIntervento?: Date | null; pdfPath?: null } = {};

  if (stato !== undefined) {
    if (!['BOZZA', 'IN_LAVORAZIONE', 'COMPLETATO'].includes(stato)) {
      return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }
    data.stato = stato;
  }

  if (dataIntervento !== undefined) {
    if (dataIntervento === null || dataIntervento === '') {
      data.dataIntervento = null;
    } else {
      const parsed = new Date(dataIntervento);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Data intervento non valida' }, { status: 400 });
      }
      data.dataIntervento = parsed;
    }
  }

  const { id } = await params;
  const reportId = parseInt(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ error: 'Report non trovato' }, { status: 404 });
  }

  const esistente = await prisma.report.findUnique({
    where: { id: reportId },
    select: { dataIntervento: true, utenteId: true },
  });
  if (!esistente) {
    return NextResponse.json({ error: 'Report non trovato' }, { status: 404 });
  }

  // Solo l'admin o l'autore del report possono modificarlo
  if (session.user.ruolo !== 'ADMIN' && esistente.utenteId !== parseInt(session.user.id)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  // Se la data cambia, il PDF già generato non è più valido: forza la rigenerazione
  if (
    data.dataIntervento !== undefined &&
    esistente.dataIntervento?.getTime() !== data.dataIntervento?.getTime()
  ) {
    data.pdfPath = null;
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data,
  });

  return NextResponse.json(report);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono eliminare report.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const reportId = parseInt(id);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        attivita: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report non trovato' }, { status: 404 });
    }

    if (report.pdfPath) {
      const pdfFullPath = path.join(process.cwd(), 'public', report.pdfPath);
      if (fs.existsSync(pdfFullPath)) {
        fs.unlinkSync(pdfFullPath);
        console.log(`PDF eliminato: ${pdfFullPath}`);
      }
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Report eliminato con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione report:', error);
    return NextResponse.json(
      { error: 'Errore durante eliminazione del report' },
      { status: 500 }
    );
  }
}
