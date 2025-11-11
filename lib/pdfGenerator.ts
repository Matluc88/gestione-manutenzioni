import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const normalizePath = (p: string) => (p.startsWith('/') ? p.slice(1) : p);

const theme = {
  primary: '#003366',
  accent: '#FF9900',
  textDark: '#2B2B2B',
  textLight: '#FFFFFF',
  bgLight: '#F8F8F8',
  border: '#E0E0E0',
  statusOk: '#10b981',
  statusKo: '#ef4444',
  statusNa: '#6b7280'
};

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

      const fontBody = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'OpenSans-Regular.ttf'));
      const fontTitle = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf'));

      const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: false, bufferPages: true });
      const stream = fs.createWriteStream(filePath);

      doc.registerFont('body', fontBody);
      doc.registerFont('title', fontTitle);

      doc.pipe(stream);
      doc.font('body');
      doc.addPage();

      let yPosition = 50;

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

      doc.fontSize(20).font('title').fillColor(theme.primary).text(impostazioni.nomeAzienda, 50, yPosition);
      yPosition += 25;

      if (impostazioni.indirizzo) {
        doc.fontSize(10).font('body').fillColor(theme.textDark).text(impostazioni.indirizzo, 50, yPosition);
        yPosition += 15;
      }

      const contactInfo = [];
      if (impostazioni.telefono) contactInfo.push(`Tel: ${impostazioni.telefono}`);
      if (impostazioni.email) contactInfo.push(`Email: ${impostazioni.email}`);
      if (contactInfo.length > 0) {
        doc.fontSize(10).font('body').fillColor(theme.textDark).text(contactInfo.join(' • '), 50, yPosition);
        yPosition += 20;
      }

      doc.moveTo(50, yPosition).lineTo(545, yPosition).strokeColor(theme.border).stroke();
      yPosition += 30;

      doc.fontSize(18).font('title').fillColor(theme.primary).text(
        report.tipo === 'MANUTENZIONE' ? 'REPORT MANUTENZIONE ORDINARIA' : 'REPORT INTERVENTO TECNICO',
        50,
        yPosition,
        { align: 'center' }
      );
      yPosition += 30;

      doc.fontSize(12).font('title').fillColor(theme.textDark).text(`Codice Report: ${report.codice}`, 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('body').fillColor(theme.textDark);
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
      doc.moveTo(50, yPosition).lineTo(545, yPosition).strokeColor(theme.border).stroke();
      yPosition += 20;

      doc.fontSize(14).font('title').fillColor(theme.primary).text('ATTIVITÀ', 50, yPosition);
      yPosition += 20;

      if (report.attivita.length === 0) {
        doc.fontSize(10).font('body').fillColor(theme.textDark).text('Nessuna attività registrata', 50, yPosition);
      } else {
        report.attivita.forEach((att, index) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(11).font('title').fillColor(theme.textDark);
          const descrizione = `${index + 1}. ${att.descrizione}`;
          const descHeight = doc.heightOfString(descrizione, { width: 495 });
          doc.text(descrizione, 50, yPosition, { width: 495 });
          yPosition += descHeight + 6;

          if (att.componente) {
            doc.fontSize(9).font('body').fillColor(theme.textDark);
            const componenteText = `Componente: ${att.componente.nome}`;
            const compHeight = doc.heightOfString(componenteText, { width: 475 });
            doc.text(componenteText, 70, yPosition);
            yPosition += compHeight + 4;
          }

          const statoLabel = att.stato === 'FATTO' ? 'FATTO' : 
                            att.stato === 'NON_FATTO' ? 'NON FATTO' : 
                            'NON APPLICABILE';
          const statoColor = att.stato === 'FATTO' ? theme.statusOk : 
                            att.stato === 'NON_FATTO' ? theme.statusKo : 
                            theme.statusNa;

          doc.fontSize(9).font('body').fillColor(statoColor);
          const statoText = `Stato: ${statoLabel}`;
          const statoHeight = doc.heightOfString(statoText, { width: 475 });
          doc.text(statoText, 70, yPosition);
          doc.fillColor(theme.textDark);
          yPosition += statoHeight + 4;

          if (att.motivazione) {
            doc.fontSize(9).font('title').fillColor(theme.textDark);
            const motivazioneLabel = 'Motivazione:';
            const motivazioneLabelHeight = doc.heightOfString(motivazioneLabel);
            doc.text(motivazioneLabel, 70, yPosition);
            yPosition += motivazioneLabelHeight + 2;
            
            doc.fontSize(9).font('body').fillColor(theme.textDark);
            const motivazioneHeight = doc.heightOfString(att.motivazione, { width: 475 });
            doc.text(att.motivazione, 70, yPosition, { width: 475 });
            yPosition += motivazioneHeight + 5;
          }

          if (att.note) {
            doc.fontSize(9).font('title').fillColor(theme.textDark);
            const noteLabel = 'Note:';
            const noteLabelHeight = doc.heightOfString(noteLabel);
            doc.text(noteLabel, 70, yPosition);
            yPosition += noteLabelHeight + 2;
            
            doc.fontSize(9).font('body').fillColor(theme.textDark);
            const noteHeight = doc.heightOfString(att.note, { width: 475 });
            doc.text(att.note, 70, yPosition, { width: 475 });
            yPosition += noteHeight + 5;
          }

          if (att.foto.length > 0) {
            const bottomMargin = doc.page.height - 50;
            const headerHeight = 15;
            
            if (yPosition + headerHeight > bottomMargin) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(9).font('title').fillColor(theme.textDark).text(`Foto (${att.foto.length}):`, 70, yPosition);
            yPosition += 15;

            att.foto.forEach((foto) => {
              const imageBlockHeight = 175;
              
              if (yPosition + imageBlockHeight > bottomMargin) {
                doc.addPage();
                yPosition = 50;
              }
              
              const fotoFullPath = path.join(process.cwd(), 'public', normalizePath(foto.filePath));
              if (fs.existsSync(fotoFullPath)) {
                try {
                  doc.image(fotoFullPath, 70, yPosition, { width: 200, height: 150, fit: [200, 150] });
                  doc.fontSize(8).font('body').fillColor(theme.textDark).text(foto.fileName, 70, yPosition + 155, { width: 200 });
                  yPosition += 175;
                } catch (err) {
                  console.error(`Errore caricamento foto ${foto.fileName}:`, err);
                  doc.fontSize(8).font('body').fillColor(theme.textDark).text(
                    `[Foto non disponibile: ${foto.fileName}]`,
                    70,
                    yPosition
                  );
                  yPosition += 15;
                }
              } else {
                doc.fontSize(8).font('body').fillColor(theme.textDark).text(
                  `[File non trovato: ${foto.fileName}]`,
                  70,
                  yPosition
                );
                yPosition += 15;
              }
            });
          }

          yPosition += 10;
          if (yPosition < 750) {
            doc.moveTo(50, yPosition).lineTo(545, yPosition).strokeColor(theme.border).stroke();
            yPosition += 15;
          }
        });
      }

      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      yPosition += 20;
      doc.fontSize(9).font('body').fillColor(theme.textDark).text(
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
            doc.opacity(0.08);
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
        
        doc.fontSize(8).font('body').fillColor(theme.textDark).text(
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
