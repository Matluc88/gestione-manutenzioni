import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generaCodiceReport } from '@/lib/utils';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  
  const search = searchParams.get('search') || '';
  const impiantoId = searchParams.get('impiantoId');
  const utenteId = searchParams.get('utenteId');
  const tipo = searchParams.get('tipo');
  const stato = searchParams.get('stato');
  const dataInizio = searchParams.get('dataInizio');
  const dataFine = searchParams.get('dataFine');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: any = {};

  if (search) {
    where.OR = [
      { codice: { contains: search, mode: 'insensitive' } },
      { impianto: { nome: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (impiantoId) {
    where.impiantoId = parseInt(impiantoId);
  }

  if (session.user.ruolo === 'ADMIN' && utenteId) {
    where.utenteId = parseInt(utenteId);
  } else if (session.user.ruolo === 'COLLABORATORE') {
    where.utenteId = parseInt(session.user.id);
  }

  if (tipo && (tipo === 'MANUTENZIONE' || tipo === 'INTERVENTO')) {
    where.tipo = tipo;
  }

  if (stato && (stato === 'BOZZA' || stato === 'IN_LAVORAZIONE' || stato === 'COMPLETATO')) {
    where.stato = stato as 'BOZZA' | 'IN_LAVORAZIONE' | 'COMPLETATO';
  }

  if (dataInizio || dataFine) {
    const dateFilter: any = {};
    if (dataInizio) {
      dateFilter.gte = new Date(dataInizio);
    }
    if (dataFine) {
      const endDate = new Date(dataFine);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }
    where.creatoIl = dateFilter;
  }

  try {
    const [report, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          impianto: {
            select: { nome: true, proprieta: true },
          },
          utente: {
            select: { username: true },
          },
          attivita: {
            select: { id: true },
          },
        },
        orderBy: { creatoIl: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      report: report.map((r: any) => ({
        id: r.id,
        codice: r.codice,
        tipo: r.tipo,
        stato: r.stato,
        pdfPath: r.pdfPath,
        creatoIl: r.creatoIl,
        modificatoIl: r.modificatoIl,
        impiantoId: r.impiantoId,
        impianto: r.impianto,
        utente: r.utente,
        numAttivita: r.attivita.length,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Errore lista report:', error);
    return NextResponse.json(
      { error: 'Errore durante caricamento report' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const { impiantoId, tipo } = body;

  if (!impiantoId || !tipo) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
  }

  const codice = await generaCodiceReport(tipo);

  const report = await prisma.report.create({
    data: {
      codice,
      tipo,
      stato: 'BOZZA',
      impiantoId: parseInt(impiantoId),
      utenteId: parseInt(session.user.id),
    },
  });

  return NextResponse.json(report, { status: 201 });
}
