import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename;
    
    // Locate the Next.js public/uploads directory
    const cwd = process.cwd();
    const isStandalone = cwd.includes('.next') && cwd.includes('standalone');
    const rootDir = isStandalone ? path.join(cwd, '../../') : cwd;
    const filePath = path.join(rootDir, 'public', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Image Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
