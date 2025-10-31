import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

interface GeneratePDFOptions {
  reportId: number;
}

export async function generateReportPDF({ reportId }: GeneratePDFOptions): Promise<string> {
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
    throw new Error('Report non trovato');
  }

  const impostazioni = await prisma.impostazioni.findUnique({
    where: { id: 1 },
  });

  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  });

  const pdfDir = path.join(process.cwd(), 'public', 'pdf');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const filename = `${report.codice}.pdf`;
  const pdfPath = path.join(pdfDir, filename);
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  
  const logoPath = impostazioni?.logoPath 
    ? path.join(process.cwd(), 'public', impostazioni.logoPath)
    : null;
    
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 50, 50, { width: 80 });
    } catch (error) {
      console.log('Errore caricamento logo:', error);
    }
  }

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(impostazioni?.nomeAzienda || 'Angelo S.r.l.', 400, 50, {
      width: 150,
      align: 'right',
    });

  if (impostazioni?.telefono) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Tel: ${impostazioni.telefono}`, 400, 70, {
        width: 150,
        align: 'right',
      });
  }

  if (impostazioni?.email) {
    doc.text(`Email: ${impostazioni.email}`, 400, 85, {
      width: 150,
      align: 'right',
    });
  }

  doc
    .moveTo(50, 120)
    .lineTo(545, 120)
    .stroke();

  
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(
      report.tipo === 'MANUTENZIONE' 
        ? 'REPORT MANUTENZIONE ORDINARIA' 
        : 'REPORT INTERVENTO TECNICO',
      50,
      140,
      { align: 'center' }
    );

  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor('#666666')
    .text(`Codice: ${report.codice}`, 50, 170, { align: 'center' });

  doc.fillColor('#000000'); // Reset colore

  
  let currentY = 210;

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Data:', 50, currentY);
  doc
    .font('Helvetica')
    .text(
      new Date(report.creatoIl).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      120,
      currentY
    );

  currentY += 20;
  doc
    .font('Helvetica-Bold')
    .text('Impianto:', 50, currentY);
  doc
    .font('Helvetica')
    .text(report.impianto.nome, 120, currentY);

  if (report.impianto.proprieta) {
    currentY += 20;
    doc
      .font('Helvetica-Bold')
      .text('Proprietà:', 50, currentY);
    doc
      .font('Helvetica')
      .text(report.impianto.proprieta, 120, currentY);
  }

  currentY += 20;
  doc
    .font('Helvetica-Bold')
    .text('Operatore:', 50, currentY);
  doc
    .font('Helvetica')
    .text(report.utente.username, 120, currentY);

  currentY += 40;

  doc
    .moveTo(50, currentY)
    .lineTo(545, currentY)
    .stroke();

  currentY += 30;

  
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Attività', 50, currentY);

  currentY += 30;

  for (let i = 0; i < report.attivita.length; i++) {
    const att = report.attivita[i];

    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`${i + 1}. ${att.descrizione}`, 50, currentY, {
        width: 495,
      });

    currentY += 25;

    if (att.componente) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Componente: ${att.componente.nome}`, 70, currentY);
      doc.fillColor('#000000');
      currentY += 20;
    }

    let statoText = '';
    let statoColor = '#000000';
    
    switch (att.stato) {
      case 'FATTO':
        statoText = '✓ FATTO';
        statoColor = '#16a34a'; // verde
        break;
      case 'NON_FATTO':
        statoText = '✗ NON FATTO';
        statoColor = '#dc2626'; // rosso
        break;
      case 'NON_APPLICABILE':
        statoText = '○ NON APPLICABILE';
        statoColor = '#6b7280'; // grigio
        break;
    }

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(statoColor)
      .text(`Stato: ${statoText}`, 70, currentY);
    doc.fillColor('#000000');
    currentY += 25;

    if (att.motivazione) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Motivazione:', 70, currentY);
      currentY += 15;
      doc
        .font('Helvetica')
        .text(att.motivazione, 70, currentY, {
          width: 475,
          align: 'justify',
        });
      currentY += doc.heightOfString(att.motivazione, { width: 475 }) + 10;
    }

    if (att.note) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Note:', 70, currentY);
      currentY += 15;
      doc
        .font('Helvetica')
        .text(att.note, 70, currentY, {
          width: 475,
          align: 'justify',
        });
      currentY += doc.heightOfString(att.note, { width: 475 }) + 10;
    }

    if (att.foto.length > 0) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Foto (${att.foto.length}):`, 70, currentY);
      currentY += 20;

      for (const foto of att.foto) {
        const fotoPath = path.join(process.cwd(), 'public', foto.filePath);
        
        if (fs.existsSync(fotoPath)) {
          try {
            if (currentY > 550) {
              doc.addPage();
              currentY = 50;
            }

            doc.image(fotoPath, 70, currentY, {
              width: 200,
              fit: [200, 200],
            });

            doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#666666')
              .text(foto.fileName, 70, currentY + 210, {
                width: 200,
                align: 'center',
              });
            doc.fillColor('#000000');

            currentY += 240;
          } catch (error) {
            console.log('Errore inserimento foto:', foto.fileName, error);
          }
        }
      }
    }

    currentY += 20;

    if (i < report.attivita.length - 1) {
      doc
        .strokeColor('#cccccc')
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();
      doc.strokeColor('#000000');
      currentY += 20;
    }
  }

  
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    doc
      .strokeColor('#cccccc')
      .moveTo(50, 780)
      .lineTo(545, 780)
      .stroke();
    doc.strokeColor('#000000');

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        impostazioni?.intestazionePdf || 'Report generato automaticamente',
        50,
        790,
        { width: 300, align: 'left' }
      );

    doc.text(
      `Pagina ${i + 1} di ${range.count}`,
      0,
      790,
      { width: 545, align: 'right' }
    );
    
    doc.fillColor('#000000');
  }

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return `/pdf/${filename}`;
}
