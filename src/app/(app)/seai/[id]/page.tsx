'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Camera, Loader2, FileText, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { useSeaiProject } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner, Field } from '@/components/ui/Bits';
import { apiPatch, apiPost, apiDelete, uploadFile } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { SEAI_GRANTS } from '@/lib/trades';
import type { ChecklistItem } from '@/lib/trades';

export default function SeaiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { project, isLoading, mutate } = useSeaiProject(id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState({ applicationRef: '', berBefore: '', berAfter: '', grantAmount: '', notes: '' });
  const [uploading, setUploading] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (project && !hydrated) {
      setFields({
        applicationRef: project.applicationRef ?? '',
        berBefore: project.berBefore ?? '',
        berAfter: project.berAfter ?? '',
        grantAmount: project.grantAmount != null ? String(project.grantAmount) : '',
        notes: project.notes ?? '',
      });
      setHydrated(true);
    }
  }, [project, hydrated]);

  if (isLoading || !project) return <Spinner />;

  const meta = SEAI_GRANTS[project.grantType];
  const doneCount = project.checklist.filter((c) => c.done).length;

  async function patch(data: Record<string, unknown>) {
    await apiPatch(`/api/seai/${id}`, data);
    await mutate();
  }

  async function toggleItem(item: ChecklistItem) {
    const next = project!.checklist.map((c) => (c.key === item.key ? { ...c, done: !c.done } : c));
    await patch({ checklist: next });
  }

  async function saveFields() {
    setSavingFields(true);
    try {
      await patch({
        applicationRef: fields.applicationRef || null,
        berBefore: fields.berBefore || null,
        berAfter: fields.berAfter || null,
        grantAmount: fields.grantAmount ? parseFloat(fields.grantAmount) : null,
        notes: fields.notes || null,
      });
      toast('Saved', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSavingFields(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      await apiPost(`/api/seai/${id}/documents`, {
        label: file.name,
        url,
        kind: file.type.startsWith('image/') ? 'photo' : 'document',
      });
      await mutate();
      toast('Document added', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function deleteDoc(docId: string) {
    if (!confirm('Remove this document?')) return;
    await apiDelete(`/api/seai/${id}/documents?docId=${docId}`);
    await mutate();
  }

  async function remove() {
    if (!confirm('Delete this SEAI workflow?')) return;
    await apiDelete(`/api/seai/${id}`);
    toast('Deleted', 'success');
    router.push('/seai');
  }

  return (
    <div>
      <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-sm text-base-muted">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{meta?.label ?? project.grantType}</h1>
        <p className="mt-0.5 text-sm text-base-muted">
          {project.job?.customer?.name} · {doneCount}/{project.checklist.length} steps complete
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-base-surface2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${project.checklist.length ? (doneCount / project.checklist.length) * 100 : 0}%` }}
        />
      </div>

      {/* Checklist */}
      <h2 className="mb-2 text-sm font-semibold text-base-muted">Evidence checklist</h2>
      <Card className="mb-5 divide-y divide-base-border">
        {project.checklist.map((item) => (
          <button
            key={item.key}
            onClick={() => toggleItem(item)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-base-surface2"
          >
            {item.done ? (
              <CheckCircle2 size={18} className="shrink-0 text-accent" />
            ) : (
              <Circle size={18} className="shrink-0 text-base-muted" />
            )}
            <span className={`text-sm ${item.done ? 'text-base-muted line-through' : ''}`}>{item.label}</span>
          </button>
        ))}
      </Card>

      {/* Documents */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-muted">Photos & documents</h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs font-medium text-accent disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} Add
        </button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" hidden onChange={onFile} />
      </div>
      <Card className="mb-5 p-3">
        {(project.documents?.length ?? 0) === 0 ? (
          <p className="px-1 py-2 text-sm text-base-muted">
            No documents yet. Tap Add to capture a photo or attach a BER cert / Declaration of Works.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {project.documents!.map((doc) => (
              <div key={doc.id} className="group relative">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
                  {doc.kind === 'photo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.url} alt={doc.label} className="aspect-square w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg bg-base-surface2 p-2 text-center">
                      <FileText size={20} className="text-base-muted" />
                      <span className="line-clamp-2 text-[10px] text-base-muted">{doc.label}</span>
                    </div>
                  )}
                </a>
                <button
                  onClick={() => deleteDoc(doc.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Grant details */}
      <h2 className="mb-2 text-sm font-semibold text-base-muted">Grant details</h2>
      <Card className="mb-5 space-y-3 p-4">
        <Field label="SEAI application reference">
          <Input
            value={fields.applicationRef}
            onChange={(e) => setFields((f) => ({ ...f, applicationRef: e.target.value }))}
            placeholder="e.g. HEA-123456"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="BER before">
            <Input value={fields.berBefore} onChange={(e) => setFields((f) => ({ ...f, berBefore: e.target.value }))} placeholder="e.g. D1" />
          </Field>
          <Field label="BER after">
            <Input value={fields.berAfter} onChange={(e) => setFields((f) => ({ ...f, berAfter: e.target.value }))} placeholder="e.g. B3" />
          </Field>
        </div>
        <Field label="Grant amount (€)">
          <Input
            type="number"
            inputMode="decimal"
            value={fields.grantAmount}
            onChange={(e) => setFields((f) => ({ ...f, grantAmount: e.target.value }))}
            placeholder="e.g. 1500"
          />
        </Field>
        <Field label="Notes">
          <Textarea rows={2} value={fields.notes} onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
        <Button onClick={saveFields} disabled={savingFields} className="w-full">
          {savingFields && <Loader2 size={16} className="animate-spin" />}
          Save details
        </Button>
      </Card>

      {/* Status toggles */}
      <Card className="mb-5 divide-y divide-base-border">
        <ToggleRow
          label="Submitted to SEAI"
          checked={project.submitted}
          onChange={(v) => patch({ submitted: v })}
        />
        <ToggleRow label="Grant approved" checked={project.approved} onChange={(v) => patch({ approved: v })} />
      </Card>

      {project.grantAmount != null && (
        <p className="mb-4 text-sm text-base-muted">
          Estimated grant value: <span className="font-medium text-base-text">{formatCurrency(project.grantAmount)}</span>
        </p>
      )}

      {project.job && (
        <Link href={`/jobs/${project.jobId}`} className="mb-4 flex items-center gap-1 text-sm text-accent">
          <ExternalLink size={14} /> Go to job
        </Link>
      )}

      <button onClick={remove} className="flex items-center gap-2 text-sm text-danger">
        <Trash2 size={15} /> Delete SEAI workflow
      </button>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between px-4 py-3">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-accent' : 'bg-base-surface2'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </label>
  );
}
