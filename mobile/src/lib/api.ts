import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');
const TOKEN_KEY = 'eci_session_token';
let temporaryToken: string | null = null;
const sessionExpiredListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}

export async function setToken(token: string | null, remember = false) {
  if (Platform.OS === 'web') return;
  temporaryToken = token;
  if (remember && token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = Platform.OS === 'web' ? null : temporaryToken || await SecureStore.getItemAsync(TOKEN_KEY);
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-ECI-Request': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch { throw new Error('Não foi possível conectar ao servidor. Verifique se a API está ligada.'); }
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/login') {
      void setToken(null);
      sessionExpiredListeners.forEach(listener => listener());
    }
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || 'Não foi possível concluir a operação.') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
