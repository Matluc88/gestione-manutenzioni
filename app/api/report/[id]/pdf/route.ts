import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateReportPDF } from '@/lib/pdfGenerator';
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

  try {
    const { id } = await params;
    const reportId = parseInt(id);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
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

    if (session.user.ruolo !== 'ADMIN' && report.utenteId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const impostazioni = await prisma.impostazioni.findUnique({
      where: { id: 1 },
    });

    if (!impostazioni) {
      return NextResponse.json({ error: 'Impostazioni non trovate' }, { status: 500 });
    }

    let pdfPath = report.pdfPath;

    if (!pdfPath || !fs.existsSync(path.join(process.cwd(), 'public', pdfPath))) {
      pdfPath = await generateReportPDF(report, impostazioni);

      await prisma.report.update({
        where: { id: reportId },
        data: { pdfPath },
      });
    }

    const pdfFullPath = path.join(process.cwd(), 'public', pdfPath);

    if (!fs.existsSync(pdfFullPath)) {
      return NextResponse.json({ error: 'PDF non trovato' }, { status: 404 });
    }

    const pdfBuffer = fs.readFileSync(pdfFullPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.codice}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Errore generazione PDF:', error);
    return NextResponse.json(
      { error: 'Errore durante generazione PDF' },
      { status: 500 }
    );
  }
}
