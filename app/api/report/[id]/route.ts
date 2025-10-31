import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono eliminare report.' },
      { status: 403 }
    );
  }

  try {
    const reportId = parseInt(params.id);

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
