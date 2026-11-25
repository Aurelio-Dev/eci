import { useState } from 'react';
import { useUsers, User } from '../lib/useUsers';

export default function Users() {
  const { users, message, busy, create, toggle, reset } = useUsers(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('operator');
  const [target, setTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  return <section aria-label="Gestão de usuários">
    <div className="eci-section-head"><div><p className="eci-eyebrow">ACESSO AO PAINEL</p><h2>Usuários</h2></div></div>
    {message && <p className="admin-react-notice" role="status">{message}</p>}
    <form className="eci-form eci-detail-panel" onSubmit={async event => { event.preventDefault(); if (await create(username, password, role)) { setUsername(''); setPassword(''); } }}>
      <h3>Cadastrar usuário</h3><label>Nome de acesso<input required maxLength={100} autoComplete="off" value={username} onChange={event => setUsername(event.target.value)} /></label>
      <label>Senha inicial<input required minLength={12} maxLength={512} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
      <label>Perfil<select value={role} onChange={event => setRole(event.target.value as User['role'])}><option value="operator">Operador</option><option value="admin">Administrador</option></select></label>
      <button className="eci-button" disabled={busy} type="submit">Criar usuário</button>
    </form>
    <div className="eci-register-list">{users.map(user => <article className="eci-person-row" key={user.id}><span className="eci-person-mark">{user.username.charAt(0).toUpperCase()}</span><div><h3>{user.username}</h3><p>{user.role === 'admin' ? 'Administrador' : 'Operador'}</p></div><span className={`eci-status ${user.active ? 'is-active' : ''}`}>{user.active ? 'Ativo' : 'Inativo'}</span><div className="eci-person-actions"><button disabled={busy} type="button" onClick={() => { if (window.confirm(`${user.active ? 'Desativar' : 'Ativar'} ${user.username}?`)) void toggle(user); }}>{user.active ? 'Desativar' : 'Ativar'}</button><button disabled={busy} type="button" onClick={() => { setTarget(user); setNewPassword(''); }}>Redefinir senha</button></div></article>)}</div>
    {target && <form className="eci-form eci-detail-panel" onSubmit={async event => { event.preventDefault(); if (await reset(target, newPassword)) { setTarget(null); setNewPassword(''); } }}><h3>Redefinir senha de {target.username}</h3><p>As sessões deste usuário serão encerradas.</p><label>Nova senha<input type="password" autoComplete="new-password" required minLength={12} maxLength={512} value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label><div className="eci-actions"><button className="eci-button" disabled={busy} type="submit">Redefinir senha</button><button type="button" onClick={() => { setTarget(null); setNewPassword(''); }}>Cancelar</button></div></form>}
  </section>;
}
