import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { PageShell } from '../components/Shell';
import { getSession, login } from '../lib/session';
import { colors, fonts } from '../lib/theme';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { void getSession().then(session => { if (session) router.replace('/admin'); }).catch(cause => setError(cause.message)); }, []);
  const submit = async () => {
    if (!usuario.trim() || !senha) { setError('Informe o usuário e a senha.'); return; }
    setBusy(true); setError('');
    try {
      if (await login(usuario, senha, remember)) router.replace('/admin');
      else { setSenha(''); setError('Usuário ou senha incorretos.'); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a sessão.'); }
    finally { setBusy(false); }
  };
  return <PageShell includeFooter={false}><Head><title>Entrar — EC Itapetininga</title><meta name="robots" content="noindex,nofollow" /></Head><View style={styles.layout}>
    <View style={styles.brand}><Image source={require('../../assets/images/eci.png')} style={styles.logo} resizeMode="contain" /><Text style={styles.brandTitle}>EC ITAPETININGA</Text><Text style={styles.brandSince}>DESDE 1950</Text><Text style={styles.brandDescription}>Área restrita à comissão administrativa do clube.</Text><Pressable accessibilityRole="link" onPress={() => router.push('/')}><Text style={styles.back}>← Voltar ao site do clube</Text></Pressable></View>
    <View style={styles.panel}><Text accessibilityRole="header" style={styles.title}>ENTRAR</Text><Text style={styles.subtitle}>Informe suas credenciais para acessar o painel administrativo.</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Text style={styles.label}>USUÁRIO</Text><TextInput accessibilityLabel="Usuário" autoCapitalize="none" autoComplete="username" value={usuario} onChangeText={setUsuario} style={styles.input} />
      <Text style={styles.label}>SENHA</Text><TextInput accessibilityLabel="Senha" autoComplete="current-password" secureTextEntry={!visible} value={senha} onChangeText={setSenha} style={styles.input} onSubmitEditing={() => void submit()} />
      <Pressable accessibilityRole="button" accessibilityState={{ selected: visible }} onPress={() => setVisible(!visible)}><Text style={styles.show}>{visible ? 'Ocultar senha' : 'Mostrar senha'}</Text></Pressable>
      <View style={styles.remember}><Switch accessibilityLabel="Manter conectado neste dispositivo" value={remember} onValueChange={setRemember} trackColor={{ true: colors.blue }} /><Text style={styles.rememberText}>Manter conectado neste dispositivo</Text></View>
      <Pressable disabled={busy} accessibilityRole="button" onPress={() => void submit()} style={[styles.submit, busy && { opacity: .6 }]}><Text style={styles.submitText}>{busy ? 'ENTRANDO...' : 'ENTRAR NO PAINEL'}</Text></Pressable>
      <Text style={styles.help}>Esqueceu a senha? Procure a comissão administrativa do clube.</Text>
    </View>
  </View></PageShell>;
}

const styles = StyleSheet.create({ layout: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f4f6fb' }, brand: { flex: 1, minWidth: 300, backgroundColor: colors.navy, minHeight: 560, padding: 44, justifyContent: 'center', alignItems: 'flex-start' }, logo: { width: 90, height: 100, marginBottom: 16 }, brandTitle: { color: '#fff', fontFamily: fonts.condensed, fontSize: 36, letterSpacing: 2 }, brandSince: { color: colors.gold, fontFamily: fonts.condensed, fontSize: 20, letterSpacing: 2 }, brandDescription: { color: '#fff', fontFamily: fonts.body, fontSize: 18, lineHeight: 28, marginTop: 40, maxWidth: 300 }, back: { color: colors.gold, fontFamily: fonts.medium, marginTop: 32, textDecorationLine: 'underline' }, panel: { flex: 1, minWidth: 320, maxWidth: 620, alignSelf: 'center', padding: 38 }, title: { color: colors.navy, fontFamily: fonts.display, fontSize: 56 }, subtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 17, marginBottom: 30 }, label: { color: colors.navy, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1, marginBottom: 8, marginTop: 12 }, input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', borderRadius: 5, padding: 14, fontFamily: fonts.body, fontSize: 17 }, show: { color: colors.blue, textAlign: 'right', fontFamily: fonts.medium, marginTop: 8 }, remember: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 10 }, rememberText: { color: colors.ink, fontFamily: fonts.body, flexShrink: 1 }, submit: { backgroundColor: colors.gold, padding: 16, alignItems: 'center' }, submitText: { color: colors.navy, fontFamily: fonts.condensed, fontSize: 22, letterSpacing: 1 }, help: { color: colors.muted, fontFamily: fonts.body, marginTop: 20, lineHeight: 22 }, demo: { color: colors.muted, fontFamily: fonts.body, marginTop: 24, backgroundColor: '#fff7d8', padding: 12, lineHeight: 22 }, error: { backgroundColor: '#fff0ef', color: '#b42318', fontFamily: fonts.medium, padding: 12, marginBottom: 14 } });
