import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateReportPDF } from '@/lib/pdf-generator';
import fs from 'fs';
import path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const reportId = parseInt(params.id);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        attivita: {
          include: {
            foto: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report non trovato' }, { status: 404 });
    }

    const attivitaSenzaFoto = report.attivita.filter(
      (att) =>
        (att.stato === 'FATTO' || att.stato === 'NON_FATTO') &&
        att.foto.length === 0
    );

    if (attivitaSenzaFoto.length > 0) {
      return NextResponse.json(
        {
          error: `Mancano foto obbligatorie per ${attivitaSenzaFoto.length} attività`,
        },
        { status: 400 }
      );
    }

    const pdfPath = await generateReportPDF({ reportId });

    await prisma.report.update({
      where: { id: reportId },
      data: {
        pdfPath,
        stato: 'COMPLETATO',
      },
    });

    return NextResponse.json({
      success: true,
      pdfPath,
      message: 'PDF generato con successo',
    });
  } catch (error) {
    console.error('Errore generazione PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore durante generazione PDF';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!report || !report.pdfPath) {
      return NextResponse.json({ error: 'PDF non trovato' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', report.pdfPath);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File PDF non trovato' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.codice}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Errore download PDF:', error);
    return NextResponse.json(
      { error: 'Errore durante download' },
      { status: 500 }
    );
  }
}
