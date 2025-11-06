import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
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
  const impianto = await prisma.impianto.findUnique({
    where: { id: parseInt(id) },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono modificare gli impianti.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { nome, proprieta, inManutenzione, inIntervento } = body;

  const { id } = await params;
  const updateData: any = {
    nome,
    proprieta: proprieta || null,
  };

  if (inManutenzione !== undefined) {
    updateData.inManutenzione = inManutenzione;
  }
  if (inIntervento !== undefined) {
    updateData.inIntervento = inIntervento;
  }

  const impianto = await prisma.impianto.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  return NextResponse.json(impianto);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const impiantoId = parseInt(id);

    const impianto = await prisma.impianto.findUnique({
      where: { id: impiantoId },
      select: { creatoId: true },
    });

    if (!impianto) {
      return NextResponse.json({ error: 'Impianto non trovato' }, { status: 404 });
    }

    const isAdmin = session.user.ruolo === 'ADMIN';
    const isCreator = impianto.creatoId === parseInt(session.user.id);

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Non autorizzato. Solo gli admin o il creatore possono eliminare l\'impianto.' },
        { status: 403 }
      );
    }

    const reports = await prisma.report.findMany({
      where: { impiantoId },
      select: {
        pdfPath: true,
        attivita: {
          select: {
            foto: {
              select: { filePath: true },
            },
          },
        },
      },
    });

    const filesToDelete: string[] = [];
    reports.forEach((report) => {
      if (report.pdfPath) {
        filesToDelete.push(report.pdfPath);
      }
      report.attivita.forEach((attivita) => {
        attivita.foto.forEach((foto) => {
          filesToDelete.push(foto.filePath);
        });
      });
    });

    await prisma.$transaction([
      prisma.report.deleteMany({ where: { impiantoId } }),
      prisma.componente.deleteMany({ where: { impiantoId } }),
      prisma.impianto.delete({ where: { id: impiantoId } }),
    ]);

    for (const filePath of filesToDelete) {
      try {
        const filename = path.basename(filePath);
        let fullPath: string;
        
        if (filePath.startsWith('/pdf/') || filePath.startsWith('pdf/')) {
          fullPath = path.join(process.cwd(), 'public', 'pdf', filename);
        } else if (filePath.startsWith('/uploads/') || filePath.startsWith('uploads/')) {
          fullPath = path.join('/data', 'uploads', filename);
        } else {
          continue;
        }
        
        if (existsSync(fullPath)) {
          await unlink(fullPath);
        }
      } catch (err) {
        console.error(`Errore eliminazione file ${filePath}:`, err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione impianto:', error);
    return NextResponse.json(
      { error: 'Errore durante eliminazione impianto' },
      { status: 500 }
    );
  }
}
