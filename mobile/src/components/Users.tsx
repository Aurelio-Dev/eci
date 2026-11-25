import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useUsers, User } from '../lib/useUsers';
import { colors, fonts } from '../lib/theme';

export default function Users() {
  const { users, message, busy, create, toggle, reset } = useUsers(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('operator');
  const [target, setTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const button = (label: string, action: () => void, selected = false) => <Pressable accessibilityRole="button" disabled={busy} onPress={action} style={[styles.button, selected && styles.selected]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
  return <View style={styles.card}><Text style={styles.title}>GESTÃO DE USUÁRIOS</Text>{!!message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
    <Text style={styles.label}>NOME DE ACESSO</Text><TextInput accessibilityLabel="Nome de acesso" autoCapitalize="none" maxLength={100} value={username} onChangeText={setUsername} style={styles.input} />
    <Text style={styles.label}>SENHA INICIAL (MÍNIMO 12 CARACTERES)</Text><TextInput accessibilityLabel="Senha inicial" secureTextEntry maxLength={512} value={password} onChangeText={setPassword} style={styles.input} />
    <Text style={styles.label}>PERFIL</Text><View style={styles.actions}>{button('OPERADOR', () => setRole('operator'), role === 'operator')}{button('ADMINISTRADOR', () => setRole('admin'), role === 'admin')}</View>
    {button('CRIAR USUÁRIO', () => { void create(username, password, role).then(ok => { if (ok) { setUsername(''); setPassword(''); } }); }, true)}
    {users.map(user => <View key={user.id} style={styles.row}><Text style={styles.name}>{user.username}</Text><Text>{user.role === 'admin' ? 'Administrador' : 'Operador'} · {user.active ? 'Ativo' : 'Inativo'}</Text><View style={styles.actions}>{button(user.active ? 'DESATIVAR' : 'ATIVAR', () => Alert.alert('Confirmar', `${user.active ? 'Desativar' : 'Ativar'} ${user.username}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: () => { void toggle(user); } }]))}{button('REDEFINIR SENHA', () => { setTarget(user); setNewPassword(''); })}</View></View>)}
    {target && <View style={styles.row}><Text style={styles.name}>Redefinir senha de {target.username}</Text><Text>As sessões deste usuário serão encerradas.</Text><TextInput accessibilityLabel="Nova senha" secureTextEntry maxLength={512} value={newPassword} onChangeText={setNewPassword} style={styles.input} /><View style={styles.actions}>{button('SALVAR SENHA', () => { void reset(target, newPassword).then(ok => { if (ok) { setTarget(null); setNewPassword(''); } }); }, true)}{button('CANCELAR', () => { setTarget(null); setNewPassword(''); })}</View></View>}
  </View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, padding: 16, gap: 8 }, title: { color: colors.navy, fontFamily: fonts.condensed, fontSize: 23 }, label: { color: colors.navy, fontFamily: fonts.bold, fontSize: 12 }, input: { borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.ink }, button: { backgroundColor: colors.blue, padding: 10, marginVertical: 3 }, selected: { backgroundColor: colors.navy, borderBottomWidth: 3, borderColor: colors.gold }, buttonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, row: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 12, marginTop: 12, gap: 6 }, name: { color: colors.navy, fontFamily: fonts.bold, fontSize: 16 }, message: { color: colors.blue } });
