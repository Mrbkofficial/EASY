'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { parseReceiptText } from '@/lib/receiptParser';

export interface ReceiptResult {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  receiptUrl: string;
}

export function ReceiptCapture({ onParsed }: { onParsed: (result: ReceiptResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setScanning(true);
    try {
      const [{ amount, merchant, date }, receiptUrl] = await Promise.all([
        recognizeText(file),
        uploadReceipt(file),
      ]);
      onParsed({ amount, merchant, date, receiptUrl });
      if (amount === null) {
        toast('Photo saved — couldn’t auto-read the amount, please enter it manually.', 'info');
      } else {
        toast('Receipt scanned', 'success');
      }
    } catch (err) {
      console.error(err);
      toast('Could not read that receipt. You can still enter the details manually.', 'error');
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={scanning}>
        {scanning ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Camera size={16} className="mr-2" />}
        {scanning ? 'Scanning…' : 'Scan receipt'}
      </Button>
    </>
  );
}

async function recognizeText(file: File) {
  const { default: Tesseract } = await import('tesseract.js');
  const {
    data: { text },
  } = await Tesseract.recognize(file, 'eng');
  return parseReceiptText(text);
}

async function uploadReceipt(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/budget/upload-receipt', { method: 'POST', body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Upload failed');
  }
  const data = await res.json();
  return data.url as string;
}
