import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { AdminData, emptyAdminData } from './adminData';

type Snapshot = { version: number; data: AdminData };

export function useAdminStore() {
  const [data, setData] = useState<AdminData>(emptyAdminData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  const legacy = useRef<AdminData | null>(null);
  const latest = useRef<AdminData>(emptyAdminData());
  const version = useRef(0);
  const blocked = useRef(false);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);

  useEffect(() => {
    let active = true;
    void api<Snapshot>('/api/data').then(async snapshot => {
      if (!active) return;
      latest.current = snapshot.data;
      version.current = snapshot.version;
      setData(snapshot.data);
      if (Object.values(snapshot.data).every(items => items.length === 0)) {
        try {
        const raw = await AsyncStorage.getItem('eci_admin_operacoes_v1');
        if (!raw || !active) return;
        const parsed = JSON.parse(raw) as AdminData;
        if (!['materials', 'movements', 'students', 'collaborators', 'lessons'].every(key => Array.isArray(parsed[key as keyof AdminData]))) return;
        if (!Object.values(parsed).some(items => Array.isArray(items) && items.length > 0)) return;
        legacy.current = {
          materials: parsed.materials, movements: parsed.movements, collaborators: parsed.collaborators, lessons: parsed.lessons,
          students: parsed.students.map(({ id, name, category, birthDate, guardian, phone, cpf, rg, active }) =>
            ({ id, name, category, birthDate, guardian, phone, cpf, rg, active })),
        };
        setLegacyAvailable(true);
        } catch {
          // Dados antigos inválidos não devem impedir o acesso ao banco.
        }
      }
    }).catch(cause => {
      blocked.current = true;
      if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados.');
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const update = useCallback((change: (current: AdminData) => AdminData) => {
    if (blocked.current) {
      setError('Não foi possível salvar. Recarregue a página após verificar a conexão.');
      return;
    }
    const next = change(latest.current);
    latest.current = next;
    setData(next);
    pending.current += 1;
    setSaving(true);
    setError('');
    queue.current = queue.current.then(async () => {
      try {
        if (blocked.current) return;
        const result = await api<Snapshot>('/api/data', {
          method: 'PUT', body: JSON.stringify({ version: version.current, data: next }),
        });
        version.current = result.version;
      } catch (cause) {
        blocked.current = true;
        setError((cause instanceof Error ? cause.message : 'Falha ao salvar.') + ' As alterações não confirmadas não foram gravadas. Recarregue após resolver o problema.');
      } finally {
        pending.current -= 1;
        if (pending.current === 0) setSaving(false);
      }
    });
  }, []);
  const importLocal = useCallback(() => {
    if (!legacy.current || !Object.values(latest.current).every(items => items.length === 0)) {
      setError('A importação só está disponível quando o banco estiver vazio.');
      return;
    }
    const oldData = legacy.current;
    update(() => oldData);
    setLegacyAvailable(false);
  }, [update]);
  return { data, ready, error, saving, update, legacyAvailable, importLocal };
}
