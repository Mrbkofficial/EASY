'use client';

import { useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

interface CommandBarProps {
  status: string;
  history: string[];
  onSubmit: (text: string) => void;
}

export function CommandBar({ status, history, onSubmit }: CommandBarProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  }

  return (
    <div className="flex items-center gap-2 border-t border-base-border bg-base-surface px-3 py-1.5">
      <Terminal size={14} className="shrink-0 text-base-muted" />
      <div className="hidden shrink-0 max-w-[40%] truncate text-xs text-base-muted md:block">
        {history.slice(-1)[0] ?? ''}
      </div>
      <span className="shrink-0 text-xs text-accent">{status || 'Command:'}</span>
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="Type a command (L, C, REC…) or coordinates (x,y)"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-base-muted/70"
      />
    </div>
  );
}
