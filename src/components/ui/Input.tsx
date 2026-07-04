'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-xl border border-base-border bg-base-surface px-3.5 py-2.5 text-sm text-base-text placeholder:text-base-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldBase, className)} {...props} />
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'resize-none', className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, 'appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('mb-1.5 block text-xs font-medium text-base-muted', className)}>{children}</label>;
}
