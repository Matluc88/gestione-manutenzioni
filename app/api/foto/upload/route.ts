import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const attivitaId = formData.get('attivitaId') as string;

    if (!file) {
      return NextResponse.json({ error: 'File mancante' }, { status: 400 });
    }

    if (!attivitaId) {
      return NextResponse.json({ error: 'attivitaId mancante' }, { status: 400 });
    }

    const maxFileSize = 10 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 10MB per foto' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo file non supportato. Usa JPG, PNG o WebP' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const compressedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(1920, null, { 
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomString}.jpg`;

    const uploadDir = path.join('/data', 'uploads');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, compressedBuffer);

    const foto = await prisma.foto.create({
      data: {
        filePath: `/uploads/${filename}`,
        fileName: file.name,
        fileSize: compressedBuffer.length,
        mimeType: 'image/jpeg',
        attivitaId: parseInt(attivitaId),
      },
    });

    return NextResponse.json(foto, { status: 201 });
  } catch (error) {
    console.error('Errore upload foto:', error);
    return NextResponse.json(
      { error: 'Errore durante upload' },
      { status: 500 }
    );
  }
}
