import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateReportPDF } from '@/lib/pdfGenerator';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const normalizePath = (p: string) => (p.startsWith('/') ? p.slice(1) : p);

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
    
    const { searchParams } = new URL(req.url);
    const forceRegenerate = searchParams.get('force') === '1';

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

    if (forceRegenerate && pdfPath) {
      const relPath = normalizePath(pdfPath);
      const oldPdfPath = path.join(process.cwd(), 'public', relPath);
      if (fs.existsSync(oldPdfPath)) {
        try {
          fs.unlinkSync(oldPdfPath);
        } catch (err) {
          console.error('Error deleting old PDF:', err);
        }
      }
      pdfPath = null;
    }

    const relPath = pdfPath ? normalizePath(pdfPath) : null;
    if (!pdfPath || !fs.existsSync(path.join(process.cwd(), 'public', relPath!))) {
      const reportForPDF = {
        ...report,
        creatoIl: report.creatoIl.toISOString(),
      };
      
      pdfPath = await generateReportPDF(reportForPDF, impostazioni);

      await prisma.report.update({
        where: { id: reportId },
        data: { pdfPath },
      });
    }

    const finalRelPath = normalizePath(pdfPath);
    const pdfFullPath = path.join(process.cwd(), 'public', finalRelPath);

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
