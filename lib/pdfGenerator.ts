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
  partitaIva: string | null;
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

      let headerLogoPath: string | null = null;
      let headerLogoY = yPosition;
      
      if (impostazioni.logoPath) {
        const logoFullPath = path.join(process.cwd(), 'public', normalizePath(impostazioni.logoPath));
        console.log('Header logo path:', logoFullPath, 'exists:', fs.existsSync(logoFullPath));
        if (fs.existsSync(logoFullPath)) {
          try {
            doc.image(logoFullPath, 50, yPosition, { width: 100 });
            headerLogoPath = logoFullPath;
            headerLogoY = yPosition;
            yPosition += 110;
          } catch (err) {
            console.error('Errore caricamento logo:', err);
            yPosition += 20;
          }
        } else {
          console.warn('Logo file not found at:', logoFullPath);
        }
      }

      doc.fontSize(20).font('bold').text(impostazioni.nomeAzienda, 50, yPosition);
      yPosition += 25;

      if (impostazioni.indirizzo) {
        doc.fontSize(10).font('regular').text(impostazioni.indirizzo, 50, yPosition);
        yPosition += 15;
      }

      if (impostazioni.partitaIva) {
        doc.fontSize(10).font('regular').text(`PARTITA IVA ${impostazioni.partitaIva}`, 50, yPosition);
        yPosition += 15;
      }

      const contactInfo = [];
      if (impostazioni.telefono) contactInfo.push(`Tel: ${impostazioni.telefono}`);
      if (impostazioni.email) contactInfo.push(`Email: ${impostazioni.email}`);
      if (contactInfo.length > 0) {
        doc.fontSize(10).font('regular').text(contactInfo.join(' • '), 50, yPosition);
        yPosition += 20;
      }

      doc.lineWidth(0.5).moveTo(50, yPosition).lineTo(545, yPosition).stroke();
      doc.lineWidth(1);
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
      doc.lineWidth(0.5).moveTo(50, yPosition).lineTo(545, yPosition).stroke();
      doc.lineWidth(1);
      yPosition += 20;

      if (report.attivita.length === 0) {
        doc.fontSize(10).font('regular').text('Nessuna attività registrata', 50, yPosition);
      } else {
        report.attivita.forEach((att, index) => {
          ensureSpace(80);

          const taskTitle = att.componente 
            ? `${att.componente.nome} - ${att.descrizione}`
            : att.descrizione;

          doc.fontSize(11).font('bold').text(
            `${index + 1}. ${taskTitle}`,
            50,
            yPosition,
            { width: 495 }
          );
          yPosition += 20;

          const statoLabel = att.stato === 'FATTO' ? '✓ Fatto' : 
                            att.stato === 'NON_FATTO' ? '✗ Non fatto' : 
                            '○ Non applicabile';
          const statoColor = att.stato === 'FATTO' ? '#10b981' : 
                            att.stato === 'NON_FATTO' ? '#ef4444' : 
                            '#6b7280';

          doc.fontSize(9).fillColor(statoColor).text(`Stato: ${statoLabel}`, 70, yPosition);
          doc.fillColor('#000000');
          yPosition += 15;

          const validFoto = att.foto.filter(foto => {
            const fotoFullPath = path.join('/data', normalizePath(foto.filePath));
            return fs.existsSync(fotoFullPath);
          });

          if (validFoto.length > 0) {
            const headerHeight = 15;
            ensureSpace(headerHeight);
            
            doc.fontSize(9).font('bold').text(`Foto (${validFoto.length}):`, 70, yPosition);
            yPosition += 15;

            const photoWidth = 242;
            const photoHeight = 182;
            const photoSpacing = 10;
            const leftMargin = 50;
            const photosPerRow = 2;
            const rowHeight = photoHeight + photoSpacing;

            let lastRowStartY = yPosition;
            
            validFoto.forEach((foto, fotoIndex) => {
              const column = fotoIndex % photosPerRow;
              const isNewRow = column === 0;
              
              if (isNewRow && fotoIndex > 0) {
                yPosition += rowHeight;
              }
              
              if (isNewRow) {
                lastRowStartY = yPosition;
              }
              
              if (yPosition + photoHeight > bottomMargin) {
                doc.addPage();
                yPosition = topMargin;
                lastRowStartY = yPosition;
              }
              
              const xPosition = leftMargin + column * (photoWidth + photoSpacing);
              
              const fotoFullPath = path.join('/data', normalizePath(foto.filePath));
              try {
                doc.image(fotoFullPath, xPosition, yPosition, { 
                  width: photoWidth, 
                  height: photoHeight, 
                  fit: [photoWidth, photoHeight] 
                });
              } catch (err) {
                console.error(`Errore caricamento foto ${foto.fileName}:`, err);
              }
            });
            
            yPosition = lastRowStartY + photoHeight + 10;
          }

          if (att.motivazione) {
            const labelHeight = 12;
            const textHeight = doc.fontSize(9).font('regular').heightOfString(att.motivazione, { width: 475 });
            const totalNeeded = labelHeight + textHeight + 5 + 6;
            
            ensureSpace(totalNeeded);
            
            doc.fontSize(9).font('bold').text('Motivazione:', 70, yPosition);
            yPosition += labelHeight;
            doc.fontSize(9).font('regular').text(att.motivazione, 70, yPosition, { width: 475 });
            yPosition += textHeight + 5;
          }

          if (att.note) {
            const labelHeight = 12;
            const textHeight = doc.fontSize(9).font('regular').heightOfString(att.note, { width: 475 });
            const totalNeeded = labelHeight + textHeight + 5 + 6;
            
            ensureSpace(totalNeeded);
            
            doc.fontSize(9).font('bold').text('Note:', 70, yPosition);
            yPosition += labelHeight;
            doc.fontSize(9).font('regular').text(att.note, 70, yPosition, { width: 475 });
            yPosition += textHeight + 5;
          }

          yPosition += 10;
          if (yPosition < bottomMargin - 15) {
            doc.lineWidth(0.5).moveTo(50, yPosition).lineTo(545, yPosition).strokeColor('#e5e7eb').stroke();
            doc.strokeColor('#000000').lineWidth(1);
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
            const watermarkWidth = 540;
            const watermarkHeight = 540;
            const xPosition = Math.round((pageWidth - watermarkWidth) / 2);
            const yPosition = Math.round((pageHeight - watermarkHeight) / 2);
            
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
        
        const pageNumText = `Pagina ${i - range.start + 1} di ${range.count}`;
        doc.save();
        doc.font('regular').fontSize(8).fillColor('#000000');
        const textWidth = doc.widthOfString(pageNumText);
        const x = Math.round((doc.page.width - textWidth) / 2);
        const y = doc.page.height - 40;
        doc.text(pageNumText, x, y, { lineBreak: false });
        doc.restore();
      }
      
      if (headerLogoPath && range.count > 0) {
        doc.switchToPage(range.start);
        try {
          doc.image(headerLogoPath, 50, headerLogoY, { width: 100 });
          console.log('Re-drew header logo on top of watermark');
        } catch (err) {
          console.error('Errore re-drawing header logo:', err);
        }
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
