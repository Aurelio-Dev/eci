import { useEffect, useState } from 'react';
import { api } from './api';

export type User = { id: string; username: string; role: 'admin' | 'operator'; active: boolean };
export function useUsers(enabled: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh() { setUsers(await api<User[]>('/api/users')); }
  useEffect(() => {
    let mounted = true;
    if (enabled) void api<User[]>('/api/users').then(value => { if (mounted) setUsers(value); }).catch(error => { if (mounted) setMessage(error.message); });
    return () => { mounted = false; };
  }, [enabled]);
  async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true); setMessage('');
    try { await action(); await refresh(); setMessage(success); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Operação não concluída.'); return false; }
    finally { setBusy(false); }
  }
  return { users, message, busy, create: (username: string, password: string, role: User['role']) => run(() => api('/api/users', { method: 'POST', body: JSON.stringify({ username, password, role }) }), 'Usuário criado.'), toggle: (user: User) => run(() => api(`/api/users/${user.id}/active`, { method: 'PATCH', body: JSON.stringify({ active: !user.active }) }), 'Estado atualizado.'), reset: (user: User, password: string) => run(() => api(`/api/users/${user.id}/password`, { method: 'POST', body: JSON.stringify({ password }) }), 'Senha redefinida. As sessões foram encerradas.') };
}
