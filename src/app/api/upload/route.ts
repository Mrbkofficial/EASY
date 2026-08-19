import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { withUser } from '@/lib/api';

// Uploads a photo/document to Vercel Blob and returns its public URL.
export function POST(req: NextRequest) {
  return withUser(async (userId) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'File storage is not configured. Add a Vercel Blob store (BLOB_READ_WRITE_TOKEN).' },
        { status: 501 }
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put(`uploads/${userId}/${Date.now()}-${safeName}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  });
}
