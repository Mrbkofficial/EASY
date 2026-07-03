'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Mail, Moon, Sun, Monitor, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useConnections } from '@/hooks/useConnections';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { cn, initials } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data: session } = useSession();
  const { connections, mutate } = useConnections();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const { data: prefData, mutate: mutatePref } = useSWR<{ preference: { pushEnabled: boolean; defaultReminderMins: number } }>(
    '/api/notification-preference',
    fetcher
  );

  const [appleEmail, setAppleEmail] = useState('');
  const [applePassword, setApplePassword] = useState('');
  const [connectingApple, setConnectingApple] = useState(false);

  const disconnect = async (provider: 'google' | 'azure-ad') => {
    await fetch('/api/connections/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    toast('Disconnected', 'success');
    mutate();
  };

  const connectApple = async () => {
    setConnectingApple(true);
    try {
      const res = await fetch('/api/mail/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: appleEmail.trim(), appPassword: applePassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? 'Could not connect Apple Mail', 'error');
        return;
      }
      toast('Apple Mail connected', 'success');
      setAppleEmail('');
      setApplePassword('');
      mutate();
    } finally {
      setConnectingApple(false);
    }
  };

  const disconnectApple = async () => {
    await fetch('/api/mail/apple', { method: 'DELETE' });
    toast('Apple Mail disconnected', 'success');
    mutate();
  };

  const updatePref = async (payload: Record<string, unknown>) => {
    await fetch('/api/notification-preference', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    mutatePref();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-12 sm:px-8 sm:pt-8">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>

      <Card className="mb-5 flex items-center gap-3 p-4">
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-12 w-12 rounded-full" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
            {initials(session?.user?.name)}
          </div>
        )}
        <div>
          <p className="font-medium">{session?.user?.name}</p>
          <p className="text-sm text-base-muted">{session?.user?.email}</p>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-base-muted">Connected accounts</h2>
      <Card className="mb-5 divide-y divide-base-border">
        <ConnectionRow
          label="Google (Gmail + Calendar)"
          hint="Used in Personal mode"
          connected={connections.google}
          onConnect={() => (window.location.href = '/api/connections/google/authorize')}
          onDisconnect={() => disconnect('google')}
        />
        <ConnectionRow
          label="Microsoft (Outlook Mail + Calendar)"
          hint="Used in Work mode"
          connected={connections.microsoft}
          onConnect={() => (window.location.href = '/api/connections/microsoft/authorize')}
          onDisconnect={() => disconnect('azure-ad')}
        />
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Apple / iCloud Mail</p>
              <p className="text-xs text-base-muted">Used in Personal mode · via IMAP app-specific password</p>
            </div>
            {connections.apple && <CheckCircle2 size={18} className="text-success" />}
          </div>
          {connections.apple ? (
            <div className="flex items-center justify-between rounded-xl bg-base-surface2 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <Mail size={14} />
                {connections.appleEmail}
              </span>
              <Button variant="ghost" size="icon" onClick={disconnectApple}>
                <Trash2 size={14} />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="you@icloud.com"
                value={appleEmail}
                onChange={(e) => setAppleEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx (app-specific password)"
                value={applePassword}
                onChange={(e) => setApplePassword(e.target.value)}
              />
              <Button
                size="sm"
                onClick={connectApple}
                disabled={connectingApple || !appleEmail || !applePassword}
                className="w-full"
              >
                {connectingApple ? 'Connecting…' : 'Connect Apple Mail'}
              </Button>
              <p className="text-xs text-base-muted">
                Generate one at{' '}
                <span className="font-medium">appleid.apple.com → Sign-In and Security → App-Specific Passwords</span>.
                Never use your main Apple ID password.
              </p>
            </div>
          )}
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-base-muted">Notifications</h2>
      <Card className="mb-5 space-y-4 p-4">
        <ToggleRow
          label="Push notifications"
          checked={prefData?.preference.pushEnabled ?? true}
          onChange={(v) => updatePref({ pushEnabled: v })}
        />
        <div>
          <Label>Default reminder</Label>
          <select
            className="w-full rounded-xl border border-base-border bg-base-surface px-3.5 py-2.5 text-sm"
            value={prefData?.preference.defaultReminderMins ?? 30}
            onChange={(e) => updatePref({ defaultReminderMins: Number(e.target.value) })}
          >
            <option value={0}>At due time</option>
            <option value={10}>10 minutes before</option>
            <option value={30}>30 minutes before</option>
            <option value={60}>1 hour before</option>
            <option value={1440}>1 day before</option>
          </select>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-base-muted">Appearance</h2>
      <Card className="mb-5 p-4">
        <div className="flex gap-2">
          {(
            [
              ['light', Sun, 'Light'],
              ['system', Monitor, 'System'],
              ['dark', Moon, 'Dark'],
            ] as const
          ).map(([t, Icon, label]) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors',
                theme === t ? 'border-accent bg-accent/10 text-accent' : 'border-base-border text-base-muted'
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ConnectionRow({
  label,
  hint,
  connected,
  onConnect,
  onDisconnect,
}: {
  label: string;
  hint: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-base-muted">{hint}</p>
      </div>
      {connected ? (
        <Button variant="outline" size="sm" onClick={onDisconnect}>
          Disconnect
        </Button>
      ) : (
        <Button size="sm" onClick={onConnect}>
          Connect
        </Button>
      )}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn('h-6 w-11 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-base-surface2')}
      >
        <span
          className={cn(
            'block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-[22px]'
          )}
        />
      </button>
    </div>
  );
}
