'use client';

export const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  });

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export const apiPost = <T>(url: string, body?: unknown) => send<T>(url, 'POST', body);
export const apiPatch = <T>(url: string, body?: unknown) => send<T>(url, 'PATCH', body);
export const apiDelete = <T>(url: string) => send<T>(url, 'DELETE');

// Uploads a file and returns its stored URL.
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Upload failed');
  return data.url as string;
}
