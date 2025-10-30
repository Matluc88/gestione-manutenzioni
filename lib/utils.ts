import { prisma } from './prisma';

export async function generaCodiceReport(tipo: 'MANUTENZIONE' | 'INTERVENTO'): Promise<string> {
  const anno = new Date().getFullYear();
  const prefisso = tipo === 'MANUTENZIONE' ? 'MAN' : 'INT';
  
  const ultimoReport = await prisma.report.findFirst({
    where: {
      codice: {
        startsWith: `ANG-${prefisso}-${anno}`,
      },
    },
    orderBy: { codice: 'desc' },
  });

  let numeroProgressivo = 1;
  
  if (ultimoReport) {
    const match = ultimoReport.codice.match(/-(\d+)$/);
    if (match) {
      numeroProgressivo = parseInt(match[1]) + 1;
    }
  }

  return `ANG-${prefisso}-${anno}-${numeroProgressivo.toString().padStart(4, '0')}`;
}
