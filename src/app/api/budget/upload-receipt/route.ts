import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireUserId, AuthError } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Image too large (max 8MB)' }, { status: 400 });

    const ext = file.type.split('/')[1] ?? 'jpg';
    const blob = await put(`receipts/${userId}/${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof Error && err.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { error: 'Receipt storage is not configured yet. Add a Vercel Blob store — see SETUP.md.' },
        { status: 500 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 });
  }
}
