import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo', 'logo.png');
    
    if (!fs.existsSync(logoPath)) {
      return NextResponse.json({ error: 'Logo non trovato' }, { status: 404 });
    }

    const logoBuffer = fs.readFileSync(logoPath);

    return new NextResponse(logoBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Errore lettura logo:', error);
    return NextResponse.json(
      { error: 'Errore durante lettura del logo' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono caricare il logo.' },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato non supportato. Usa JPG, PNG o WebP' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 5MB' },
        { status: 400 }
      );
    }

    const logoDir = path.join(process.cwd(), 'public', 'logo');
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }

    const existingFiles = fs.readdirSync(logoDir).filter(f => f.startsWith('logo.'));
    existingFiles.forEach(f => {
      const filePath = path.join(logoDir, f);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const outputPath = path.join(logoDir, 'logo.png');
    
    const resized = await sharp(buffer)
      .resize(400, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .ensureAlpha()
      .toBuffer();

    const alpha = await sharp(resized)
      .removeAlpha()
      .greyscale()
      .threshold(245)
      .negate()
      .toBuffer();

    await sharp(resized)
      .joinChannel(alpha)
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
    
    console.log('Logo written to:', outputPath, 'exists:', fs.existsSync(outputPath));

    const logoPath = '/logo/logo.png';

    await prisma.impostazioni.upsert({
      where: { id: 1 },
      update: { logoPath },
      create: { id: 1, logoPath },
    });

    return NextResponse.json({
      success: true,
      logoPath,
      message: 'Logo caricato con successo',
    });
  } catch (error) {
    console.error('Errore upload logo:', error);
    return NextResponse.json(
      { error: 'Errore durante upload del logo' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.ruolo !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Non autorizzato. Solo gli admin possono eliminare il logo.' },
      { status: 403 }
    );
  }

  try {
    const logoDir = path.join(process.cwd(), 'public', 'logo');
    const logoFiles = fs.readdirSync(logoDir).filter(f => f.startsWith('logo.'));
    
    logoFiles.forEach(f => {
      const filePath = path.join(logoDir, f);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await prisma.impostazioni.upsert({
      where: { id: 1 },
      update: { logoPath: null },
      create: { id: 1, logoPath: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Logo eliminato con successo',
    });
  } catch (error) {
    console.error('Errore eliminazione logo:', error);
    return NextResponse.json(
      { error: 'Errore durante eliminazione del logo' },
      { status: 500 }
    );
  }
}
