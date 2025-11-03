import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.utente.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      ruolo: 'ADMIN',
      attivo: true,
    },
  });

  await prisma.impostazioni.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nomeAzienda: 'ONE-M ENERGY SOLUTIONS',
      telefono: '+39 123 456 7890',
      email: 'info@onem-energy.it',
      intestazionePdf: 'Report generato automaticamente da ONE-M ENERGY SOLUTIONS',
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
