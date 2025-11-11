import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const normalizePath = (p: string) => (p.startsWith('/') ? p.slice(1) : p);

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
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const fileName = `${report.codice}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      const relativePath = `pdf/${fileName}`;

      const fontRegular = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Regular.ttf'));
      const fontBold = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Bold.ttf'));

      const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: false, bufferPages: true });
      const stream = fs.createWriteStream(filePath);

      doc.registerFont('regular', fontRegular);
      doc.registerFont('bold', fontBold);

      doc.pipe(stream);
      doc.font('regular');
      doc.addPage();

      const topMargin = 50;
      const bottomMargin = doc.page.height - 50;
      let yPosition = topMargin;

      const ensureSpace = (needed: number) => {
        if (yPosition + needed > bottomMargin) {
          doc.addPage();
          yPosition = topMargin;
        }
      };

      if (impostazioni.logoPath) {
        const logoFullPath = path.join(process.cwd(), 'public', normalizePath(impostazioni.logoPath));
        if (fs.existsSync(logoFullPath)) {
          try {
            doc.image(logoFullPath, 50, yPosition, { width: 100 });
            yPosition += 110;
          } catch (err) {
            console.error('Errore caricamento logo:', err);
            yPosition += 20;
          }
        }
      }

      doc.fontSize(20).font('bold').text(impostazioni.nomeAzienda, 50, yPosition);
      yPosition += 25;

      if (impostazioni.indirizzo) {
        doc.fontSize(10).font('regular').text(impostazioni.indirizzo, 50, yPosition);
        yPosition += 15;
      }

      const contactInfo = [];
      if (impostazioni.telefono) contactInfo.push(`Tel: ${impostazioni.telefono}`);
      if (impostazioni.email) contactInfo.push(`Email: ${impostazioni.email}`);
      if (contactInfo.length > 0) {
        doc.fontSize(10).font('regular').text(contactInfo.join(' • '), 50, yPosition);
        yPosition += 20;
      }

      doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();
      yPosition += 30;

      doc.fontSize(18).font('bold').text(
        report.tipo === 'MANUTENZIONE' ? 'REPORT MANUTENZIONE ORDINARIA' : 'REPORT INTERVENTO TECNICO',
        50,
        yPosition,
        { align: 'center' }
      );
      yPosition += 30;

      doc.fontSize(12).font('bold').text(`Codice Report: ${report.codice}`, 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('regular');
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

      doc.fontSize(14).font('bold').text('ATTIVITÀ', 50, yPosition);
      yPosition += 20;

      if (report.attivita.length === 0) {
        doc.fontSize(10).font('regular').text('Nessuna attività registrata', 50, yPosition);
      } else {
        report.attivita.forEach((att, index) => {
          ensureSpace(80);

          doc.fontSize(11).font('bold').text(
            `${index + 1}. ${att.descrizione}`,
            50,
            yPosition,
            { width: 495 }
          );
          yPosition += 20;

          if (att.componente) {
            doc.fontSize(9).font('regular').text(
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
            doc.fontSize(9).font('bold').text('Motivazione:', 70, yPosition);
            yPosition += 12;
            doc.fontSize(9).font('regular').text(att.motivazione, 70, yPosition, { width: 475 });
            yPosition += Math.ceil(att.motivazione.length / 80) * 12 + 5;
          }

          if (att.note) {
            doc.fontSize(9).font('bold').text('Note:', 70, yPosition);
            yPosition += 12;
            doc.fontSize(9).font('regular').text(att.note, 70, yPosition, { width: 475 });
            yPosition += Math.ceil(att.note.length / 80) * 12 + 5;
          }

          if (att.foto.length > 0) {
            const headerHeight = 15;
            ensureSpace(headerHeight);
            
            doc.fontSize(9).font('bold').text(`Foto (${att.foto.length}):`, 70, yPosition);
            yPosition += 15;

            att.foto.forEach((foto) => {
              const imageBlockHeight = 175;
              ensureSpace(imageBlockHeight);
              
              const fotoFullPath = path.join(process.cwd(), 'public', normalizePath(foto.filePath));
              if (fs.existsSync(fotoFullPath)) {
                try {
                  doc.image(fotoFullPath, 70, yPosition, { width: 200, height: 150, fit: [200, 150] });
                  doc.fontSize(8).font('regular').text(foto.fileName, 70, yPosition + 155, { width: 200 });
                  yPosition += 175;
                } catch (err) {
                  console.error(`Errore caricamento foto ${foto.fileName}:`, err);
                  doc.fontSize(8).font('regular').text(
                    `[Foto non disponibile: ${foto.fileName}]`,
                    70,
                    yPosition
                  );
                  yPosition += 15;
                }
              } else {
                doc.fontSize(8).font('regular').text(
                  `[File non trovato: ${foto.fileName}]`,
                  70,
                  yPosition
                );
                yPosition += 15;
              }
            });
          }

          yPosition += 10;
          if (yPosition < bottomMargin - 50) {
            doc.moveTo(50, yPosition).lineTo(545, yPosition).strokeColor('#e5e7eb').stroke();
            doc.strokeColor('#000000');
            yPosition += 15;
          }
        });
      }

      const footerHeight = 40;
      ensureSpace(footerHeight);

      yPosition += 20;
      doc.fontSize(9).font('regular').text(
        impostazioni.intestazionePdf,
        50,
        yPosition,
        { align: 'center', width: 495 }
      );

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        const watermarkPath = path.join(process.cwd(), 'public', 'images', 'onem-logo-watermark.jpg');
        if (fs.existsSync(watermarkPath)) {
          try {
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const watermarkWidth = 300;
            const watermarkHeight = 300;
            const xPosition = (pageWidth - watermarkWidth) / 2;
            const yPosition = (pageHeight - watermarkHeight) / 2;
            
            doc.save();
            doc.opacity(0.12);
            doc.image(watermarkPath, xPosition, yPosition, {
              width: watermarkWidth,
              height: watermarkHeight,
              fit: [watermarkWidth, watermarkHeight]
            });
            doc.restore();
          } catch (err) {
            console.error('Errore aggiunta watermark:', err);
          }
        }
        
        doc.fontSize(8).font('regular').text(
          `Pagina ${i - range.start + 1} di ${range.count}`,
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
