import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface Foto {
  id: number;
  filePath: string;
  fileName: string;
}

interface Attivita {
  id: number;
  descrizione: string;
  stato: string;
  motivazione: string | null;
  note: string | null;
  componente: {
    nome: string;
  } | null;
  foto: Foto[];
}

interface Report {
  id: number;
  codice: string;
  tipo: string;
  stato: string;
  creatoIl: string;
  impianto: {
    nome: string;
    proprieta: string | null;
  };
  utente: {
    username: string;
  };
  attivita: Attivita[];
}

interface Impostazioni {
  nomeAzienda: string;
  indirizzo: string | null;
  telefono: string | null;
  email: string | null;
  logoPath: string | null;
  intestazionePdf: string;
}

export async function generateReportPDF(
  report: Report,
  impostazioni: Impostazioni
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(process.cwd(), 'public', 'pdf');
      if (!fs.existsSync(pdfDir)) {
        console.log('[PDF] La cartella pdf non esiste, la creo:', pdfDir);
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const fileName = `${report.codice}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      const relativePath = `/pdf/${fileName}`;

      console.log('[PDF] Path file:', filePath);
      console.log('[PDF] Dati report:', JSON.stringify(report));
      console.log('[PDF] Dati impostazioni:', JSON.stringify(impostazioni));

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      let yPosition = 50;

      if (impostazioni.logoPath) {
        const logoFullPath = path.join(process.cwd(), 'public', impostazioni.logoPath);
        console.log('[PDF] Path logo:', logoFullPath);
        if (fs.existsSync(logoFullPath)) {
          try {
            doc.image(logoFullPath, 50, yPosition, { width: 100 });
            yPosition += 110;
          } catch (err) {
            console.error('Errore caricamento logo:', err);
            yPosition += 20;
          }
        } else {
          console.warn('[PDF] Logo non trovato:', logoFullPath);
        }
      }

      doc.fontSize(20).font('Helvetica-Bold').text(impostazioni.nomeAzienda, 50, yPosition);
      yPosition += 25;

      if (impostazioni.indirizzo) {
        doc.fontSize(10).font('Helvetica').text(impostazioni.indirizzo, 50, yPosition);
        yPosition += 15;
      }

      const contactInfo = [];
      if (impostazioni.telefono) contactInfo.push(`Tel: ${impostazioni.telefono}`);
      if (impostazioni.email) contactInfo.push(`Email: ${impostazioni.email}`);
      if (contactInfo.length > 0) {
        doc.fontSize(10).text(contactInfo.join(' • '), 50, yPosition);
        yPosition += 20;
      }

      doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();
      yPosition += 30;

      doc.fontSize(18).font('Helvetica-Bold').text(
        report.tipo === 'MANUTENZIONE' ? 'REPORT MANUTENZIONE ORDINARIA' : 'REPORT INTERVENTO TECNICO',
        50,
        yPosition,
        { align: 'center' }
      );
      yPosition += 30;

      doc.fontSize(12).font('Helvetica-Bold').text(`Codice Report: ${report.codice}`, 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Data: ${new Date(report.creatoIl).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 50, yPosition);
      yPosition += 15;

      doc.text(`Operatore: ${report.utente.username}`, 50, yPosition);
      yPosition += 15;

      doc.text(`Impianto: ${report.impianto.nome}`, 50, yPosition);
      yPosition += 15;

      if (report.impianto.proprieta) {
        doc.text(`Proprietà: ${report.impianto.proprieta}`, 50, yPosition);
        yPosition += 15;
      }

      yPosition += 10;
      doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();
      yPosition += 20;

      doc.fontSize(14).font('Helvetica-Bold').text('ATTIVITÀ', 50, yPosition);
      yPosition += 20;

      if (report.attivita.length === 0) {
        doc.fontSize(10).font('Helvetica-Oblique').text('Nessuna attività registrata', 50, yPosition);
      } else {
        report.attivita.forEach((att, index) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          console.log(`[PDF] Attività ${index + 1}:`, JSON.stringify(att));
          doc.fontSize(11).font('Helvetica-Bold').text(
            `${index + 1}. ${att.descrizione}`,
            50,
            yPosition,
            { width: 495 }
          );
          yPosition += 20;

          if (att.componente) {
            doc.fontSize(9).font('Helvetica').text(
              `Componente: ${att.componente.nome}`,
              70,
              yPosition
            );
            yPosition += 15;
          }

          const statoLabel = att.stato === 'FATTO' ? '✓ Fatto' : 
                            att.stato === 'NON_FATTO' ? '✗ Non fatto' : 
                            '○ Non applicabile';
          const statoColor = att.stato === 'FATTO' ? '#10b981' : 
                            att.stato === 'NON_FATTO' ? '#ef4444' : 
                            '#6b7280';

          doc.fontSize(9).fillColor(statoColor).text(`Stato: ${statoLabel}`, 70, yPosition);
          doc.fillColor('#000000');
          yPosition += 15;

          if (att.motivazione) {
            doc.fontSize(9).font('Helvetica-Bold').text('Motivazione:', 70, yPosition);
            yPosition += 12;
            doc.fontSize(9).font('Helvetica').text(att.motivazione, 70, yPosition, { width: 475 });
            yPosition += Math.ceil(att.motivazione.length / 80) * 12 + 5;
          }

          if (att.note) {
            doc.fontSize(9).font('Helvetica-Bold').text('Note:', 70, yPosition);
            yPosition += 12;
            doc.fontSize(9).font('Helvetica').text(att.note, 70, yPosition, { width: 475 });
            yPosition += Math.ceil(att.note.length / 80) * 12 + 5;
          }

          if (att.foto.length > 0) {
            doc.fontSize(9).font('Helvetica-Bold').text(`Foto (${att.foto.length}):`, 70, yPosition);
            yPosition += 15;

            att.foto.forEach((foto) => {
              const fotoFullPath = path.join(process.cwd(), 'public', foto.filePath);
              console.log(`[PDF] Path foto:`, fotoFullPath);
              if (fs.existsSync(fotoFullPath)) {
                try {
                  if (yPosition > 600) {
                    doc.addPage();
                    yPosition = 50;
                  }

                  doc.image(fotoFullPath, 70, yPosition, { width: 200, height: 150, fit: [200, 150] });
                  doc.fontSize(8).font('Helvetica').text(foto.fileName, 70, yPosition + 155, { width: 200 });
                  yPosition += 175;
                } catch (err) {
                  console.error(`Errore caricamento foto ${foto.fileName}:`, err);
                  doc.fontSize(8).font('Helvetica-Oblique').text(
                    `[Foto non disponibile: ${foto.fileName}]`,
                    70,
                    yPosition
                  );
                  yPosition += 15;
                }
              } else {
                console.warn(`[PDF] Foto non trovata:`, fotoFullPath);
              }
            });
          }

          yPosition += 10;
          if (yPosition < 750) {
            doc.moveTo(50, yPosition).lineTo(545, yPosition).strokeColor('#e5e7eb').stroke();
            doc.strokeColor('#000000');
            yPosition += 15;
          }
        });
      }

      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      yPosition += 20;
      doc.fontSize(9).font('Helvetica-Oblique').text(
        impostazioni.intestazionePdf,
        50,
        yPosition,
        { align: 'center', width: 495 }
      );

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica').text(
          `Pagina ${i + 1} di ${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center', width: 495 }
        );
      }

      doc.end();

      stream.on('finish', () => {
        resolve(relativePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}
