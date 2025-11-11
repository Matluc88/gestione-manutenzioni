import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function regenerateAllPDFs() {
  try {
    console.log('🔄 Starting PDF regeneration process...\n');

    const reports = await prisma.report.findMany({
      where: {
        stato: 'COMPLETATO',
        pdfPath: {
          not: null
        }
      },
      select: {
        id: true,
        codice: true,
        pdfPath: true
      }
    });

    console.log(`📊 Found ${reports.length} reports with cached PDFs\n`);

    let deletedCount = 0;
    let errorCount = 0;

    for (const report of reports) {
      try {
        if (report.pdfPath) {
          const pdfFullPath = path.join(process.cwd(), 'public', report.pdfPath);
          
          if (fs.existsSync(pdfFullPath)) {
            fs.unlinkSync(pdfFullPath);
            console.log(`✅ Deleted: ${report.pdfPath}`);
            deletedCount++;
          } else {
            console.log(`⚠️  File not found: ${report.pdfPath}`);
          }

          await prisma.report.update({
            where: { id: report.id },
            data: { pdfPath: null }
          });
        }
      } catch (error) {
        console.error(`❌ Error processing report ${report.codice}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ PDFs deleted: ${deletedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Database records reset: ${reports.length}`);
    console.log('\n✨ Done! PDFs will be regenerated with new styling on next access.\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateAllPDFs();
