import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { base64, filename, folder } = await req.json();
    if (!base64) {
      return NextResponse.json({ success: false, message: 'Base64 image data is required' }, { status: 400 });
    }

    // Extract the mime type and base64 data
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ success: false, message: 'Invalid base64 image data' }, { status: 400 });
    }
    
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Ensure filename is unique
    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create path to save in Next.js public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Save file locally to Next.js
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: `/uploads/${uniqueFilename}`
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
