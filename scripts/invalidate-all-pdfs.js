#!/usr/bin/env node

/**
 * Bulk PDF Invalidation Script
 * 
 * This script invalidates all cached PDFs by setting pdfPath to null in the database.
 * The next time a PDF is requested, it will be regenerated with the latest code fixes.
 * 
 * Usage:
 *   node scripts/invalidate-all-pdfs.js
 * 
 * Or to delete the physical PDF files as well:
 *   node scripts/invalidate-all-pdfs.js --delete-files
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const deleteFiles = process.argv.includes('--delete-files');

async function main() {
  console.log('🔍 Fetching all reports with cached PDFs...');
  
  const reports = await prisma.report.findMany({
    where: {
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

  console.log(`📊 Found ${reports.length} reports with cached PDFs`);

  if (reports.length === 0) {
    console.log('✅ No PDFs to invalidate');
    return;
  }

  let deletedFiles = 0;
  let failedDeletes = 0;

  if (deleteFiles) {
    console.log('🗑️  Deleting physical PDF files...');
    
    for (const report of reports) {
      if (report.pdfPath) {
        const pdfPath = path.join(process.cwd(), 'public', report.pdfPath.startsWith('/') ? report.pdfPath.slice(1) : report.pdfPath);
        
        if (fs.existsSync(pdfPath)) {
          try {
            fs.unlinkSync(pdfPath);
            deletedFiles++;
            console.log(`  ✓ Deleted: ${report.codice}`);
          } catch (err) {
            failedDeletes++;
            console.error(`  ✗ Failed to delete ${report.codice}:`, err.message);
          }
        }
      }
    }
    
    console.log(`📁 Deleted ${deletedFiles} files (${failedDeletes} failures)`);
  }

  console.log('🔄 Invalidating PDF cache in database...');
  
  const result = await prisma.report.updateMany({
    where: {
      pdfPath: {
        not: null
      }
    },
    data: {
      pdfPath: null
    }
  });

  console.log(`✅ Invalidated ${result.count} PDF cache entries`);
  console.log('');
  console.log('📝 Next steps:');
  console.log('   - PDFs will be automatically regenerated when requested');
  console.log('   - New PDFs will use the latest pagination fixes');
  console.log('   - No blank pages should appear in regenerated PDFs');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
