import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const foto = await prisma.foto.findUnique({
      where: { id: parseInt(id) },
    });

    if (!foto) {
      return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 });
    }

    const fullPath = path.join(process.cwd(), 'public', foto.filePath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }

    await prisma.foto.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione foto:', error);
    return NextResponse.json(
      { error: 'Errore durante eliminazione' },
      { status: 500 }
    );
  }
}
