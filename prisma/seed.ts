import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.utente.upsert({
    where: { username: 'angelo' },
    update: {},
    create: {
      username: 'angelo',
      passwordHash: hashedPassword,
      ruolo: 'ADMIN',
      attivo: true,
    },
  });

  await prisma.impostazioni.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nomeAzienda: 'Angelo S.r.l.',
      telefono: '+39 123 456 7890',
      email: 'info@angelo.it',
      intestazionePdf: 'Report generato automaticamente dal sistema Angelo',
    },
  });

  const componentiPredefiniti = [
    'Trasformatore',
    'Pompa',
    'Quadro elettrico',
    'Cabina MT/BT',
    'Gruppo di continuità (UPS)',
    'Sistema antincendio',
    'Impianto di climatizzazione',
    'Generatore di emergenza',
    'Motore elettrico',
    'Inverter',
  ];

  for (const nome of componentiPredefiniti) {
    await prisma.componente.upsert({
      where: { id: 0 },
      update: {},
      create: {
        nome,
        predefinito: true,
      },
    });
  }

  console.log('✅ Database inizializzato con componenti predefiniti!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
