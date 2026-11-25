import { Platform } from 'react-native';
import { api, setToken } from './api';

export type Session = { usuario: string; perfil: 'admin' | 'operator'; entradaEm: string };

export async function getSession(): Promise<Session | null> {
  try { return await api<Session>('/api/session'); }
  catch (error) {
    if ((error as Error & { status?: number }).status === 401) return null;
    throw error;
  }
}

export async function login(usuario: string, senha: string, remember: boolean): Promise<boolean> {
  try {
    const result = await api<Session & { token?: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, senha, remember, native: Platform.OS !== 'web' }),
    });
    if (result.token) await setToken(result.token, remember);
    return true;
  } catch (error) {
    if ((error as Error & { status?: number }).status === 401) return false;
    throw error;
  }
}

export async function logout() {
  try { await api('/api/logout', { method: 'POST' }); }
  finally { await setToken(null); }
}
