#!/usr/bin/env node

/**
 * Update intestazionePdf Script
 * 
 * This script updates the intestazionePdf field in the database to an empty string,
 * removing the footer text from PDF reports.
 * 
 * Usage:
 *   node scripts/update-intestazione-pdf.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating intestazionePdf to empty string...');
  
  const result = await prisma.impostazioni.update({
    where: { id: 1 },
    data: {
      intestazionePdf: ''
    }
  });

  console.log('✅ Successfully updated intestazionePdf');
  console.log('📝 Current value:', result.intestazionePdf === '' ? '(empty string)' : result.intestazionePdf);
  console.log('');
  console.log('Next steps:');
  console.log('   - New PDFs will be generated without footer text');
  console.log('   - To update existing PDFs, use ?force=1 or run invalidate-all-pdfs.js');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
