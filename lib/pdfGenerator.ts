import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const normalizePath = (p: string) => (p.startsWith('/') ? p.slice(1) : p);

/**
 * Validates if a font file has the correct TTF/OTF format by checking magic bytes
 * @param fontPath - Path to the font file
 * @returns true if valid TTF/OTF, false otherwise
 */
function validateFontFile(fontPath: string): boolean {
  try {
    if (!fs.existsSync(fontPath)) {
      console.error(`Font file not found: ${fontPath}`);
      return false;
    }

    const buffer = fs.readFileSync(fontPath);
    if (buffer.length < 4) {
      console.error(`Font file too small: ${fontPath}`);
      return false;
    }

    const magicBytes = buffer.slice(0, 4);
    const hex = magicBytes.toString('hex');
    
    const validFormats = ['00010000', '4f54544f', '74746366'];
    
    if (!validFormats.includes(hex)) {
      console.error(`Invalid font format for ${fontPath}. Magic bytes: ${hex}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating font file ${fontPath}:`, error);
    return false;
  }
}

/**
 * Loads a font with fallback to alternative fonts if the primary font is invalid
 * @param primaryPath - Primary font file path
 * @param fallbackPaths - Array of fallback font file paths
 * @returns Buffer of the first valid font found
 */
function loadFontWithFallback(primaryPath: string, fallbackPaths: string[]): Buffer {
  const allPaths = [primaryPath, ...fallbackPaths];
  
  for (const fontPath of allPaths) {
    if (validateFontFile(fontPath)) {
      console.log(`Loading font: ${fontPath}`);
      return fs.readFileSync(fontPath);
    }
  }
  
  throw new Error(`No valid font found. Tried: ${allPaths.join(', ')}`);
}

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

      const fontsDir = path.join(process.cwd(), 'public', 'fonts');
      
      const fontBody = loadFontWithFallback(
        path.join(fontsDir, 'OpenSans-Regular.ttf'),
        [
          path.join(fontsDir, 'NotoSans-Regular.ttf'),
          path.join(fontsDir, 'LiberationSans-Regular.ttf')
        ]
      );
      
      const fontTitle = loadFontWithFallback(
        path.join(fontsDir, 'Montserrat-Bold.ttf'),
        [
          path.join(fontsDir, 'NotoSans-Bold.ttf'),
          path.join(fontsDir, 'LiberationSans-Bold.ttf')
        ]
      );

      const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: false, bufferPages: true });
      const stream = fs.createWriteStream(filePath);

      doc.registerFont('body', fontBody);
      doc.registerFont('title', fontTitle);

      doc.pipe(stream);
      doc.font('body');
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

      doc.fontSize(20).font('title').fillColor(theme.primary).text(impostazioni.nomeAzienda, 50, yPosition);
      yPosition += 25;

      if (impostazioni.indirizzo) {
        doc.fontSize(10).font('body').fillColor(theme.textDark).text(impostazioni.indirizzo, 50, yPosition);
        yPosition += 15;
      }

      if (impostazioni.partitaIva) {
        doc.fontSize(10).font('body').fillColor(theme.textDark).text(`PARTITA IVA ${impostazioni.partitaIva}`, 50, yPosition);
        yPosition += 15;
      }

      const contactInfo = [];
      if (impostazioni.telefono) contactInfo.push(`Tel: ${impostazioni.telefono}`);
      if (impostazioni.email) contactInfo.push(`Email: ${impostazioni.email}`);
      if (contactInfo.length > 0) {
        doc.fontSize(10).font('body').fillColor(theme.textDark).text(contactInfo.join(' • '), 50, yPosition);
        yPosition += 20;
      }

      doc.lineWidth(0.5).moveTo(50, yPosition).lineTo(545, yPosition).strokeColor(theme.border).stroke();
      doc.lineWidth(1);
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
      doc.lineWidth(0.5).moveTo(50, yPosition).lineTo(545, yPosition).strokeColor(theme.border).stroke();
      doc.lineWidth(1);
      yPosition += 20;

      if (report.attivita.length === 0) {
        doc.fontSize(10).font('body').fillColor(theme.textDark).text('Nessuna attività registrata', 50, yPosition);
      } else {
        report.attivita.forEach((att, index) => {
          ensureSpace(80);

          const taskTitle = att.componente 
            ? `${att.componente.nome} - ${att.descrizione}`
            : att.descrizione;

          doc.fontSize(11).font('title').fillColor(theme.textDark);
          const taskHeight = doc.heightOfString(`${index + 1}. ${taskTitle}`, { width: 495 });
          doc.text(
            `${index + 1}. ${taskTitle}`,
            50,
            yPosition,
            { width: 495 }
          );
          yPosition += taskHeight + 6;

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

          const validFoto = att.foto.filter(foto => {
            const fotoFullPath = path.join('/data', normalizePath(foto.filePath));
            return fs.existsSync(fotoFullPath);
          });

          if (validFoto.length > 0) {
            const headerHeight = 15;
            ensureSpace(headerHeight);
            
            doc.fontSize(9).font('title').fillColor(theme.textDark).text(`Foto (${validFoto.length}):`, 70, yPosition);
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
            const textHeight = doc.fontSize(9).font('body').heightOfString(att.motivazione, { width: 475 });
            const totalNeeded = labelHeight + textHeight + 5 + 6;
            
            ensureSpace(totalNeeded);
            
            doc.fontSize(9).font('title').fillColor(theme.textDark).text('Motivazione:', 70, yPosition);
            yPosition += labelHeight;
            doc.fontSize(9).font('body').fillColor(theme.textDark).text(att.motivazione, 70, yPosition, { width: 475 });
            yPosition += textHeight + 5;
          }

          if (att.note) {
            const labelHeight = 12;
            const textHeight = doc.fontSize(9).font('body').heightOfString(att.note, { width: 475 });
            const totalNeeded = labelHeight + textHeight + 5 + 6;
            
            ensureSpace(totalNeeded);
            
            doc.fontSize(9).font('title').fillColor(theme.textDark).text('Note:', 70, yPosition);
            yPosition += labelHeight;
            doc.fontSize(9).font('body').fillColor(theme.textDark).text(att.note, 70, yPosition, { width: 475 });
            yPosition += textHeight + 5;
          }

          yPosition += 10;
          if (yPosition < bottomMargin - 15) {
            doc.lineWidth(0.5).moveTo(50, yPosition).lineTo(545, yPosition).strokeColor(theme.border).stroke();
            doc.strokeColor('#000000').lineWidth(1);
            yPosition += 15;
          }
        });
      }

      const footerHeight = 40;
      ensureSpace(footerHeight);

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
            const watermarkWidth = 540;
            const watermarkHeight = 540;
            const xPosition = Math.round((pageWidth - watermarkWidth) / 2);
            const yPosition = Math.round((pageHeight - watermarkHeight) / 2);
            
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
        
        const pageNumText = `Pagina ${i - range.start + 1} di ${range.count}`;
        doc.save();
        doc.font('body').fontSize(8).fillColor(theme.textDark);
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
