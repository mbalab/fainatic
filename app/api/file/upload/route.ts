import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { mkdir } from 'fs/promises';
import os from 'os';

// Конфигурация для standalone режима
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const TMP_DIR = process.env.NODE_ENV === 'production' 
  ? join(os.tmpdir(), 'fainatic-uploads') 
  : join(process.cwd(), 'tmp');

// Ensure tmp directory exists
async function ensureTmpDir() {
  try {
    await mkdir(TMP_DIR, { recursive: true });
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

// Get correct MIME type for file
function getMimeType(fileName: string, originalType: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return 'text/csv';
  }
  if (extension === 'xlsx') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (extension === 'pdf') {
    return 'application/pdf';
  }
  
  return originalType;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique file ID
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${fileId}.${fileExtension}`;

    // Ensure tmp directory exists
    await ensureTmpDir();

    // Save file to tmp directory
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(TMP_DIR, fileName);
    
    await writeFile(filePath, buffer);
    
    logger.debug('File saved:', fileName);

    // Store file metadata with correct MIME type
    const metadata = {
      originalName: file.name,
      mimeType: getMimeType(file.name, file.type),
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
    
    await writeFile(
      join(TMP_DIR, `${fileId}.json`),
      JSON.stringify(metadata)
    );

    return NextResponse.json({ file_id: fileId });
  } catch (error) {
    logger.error('Error uploading file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
} 