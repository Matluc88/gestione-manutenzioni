import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join('/data', 'uploads', filename);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.gif') contentType = 'image/gif';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Error serving image' }, { status: 500 });
  }
}
