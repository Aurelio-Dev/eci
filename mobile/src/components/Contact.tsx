import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import { useApp } from './Shell';
import { contactForm, validContact } from '../lib/logic';

const ENDPOINT = 'https://formsubmit.co/ajax/976c4eef3a206d60322c86e53f2fd8e5';
const subjects = ['Quero patrocinar', 'Inscrição na base', 'Solicitar Estatuto Social', 'Outro'];

export function Contact() {
  const { contrast, fontScale } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const submit = async () => {
    const values = { name, email, subject, message };
    if (!validContact(values)) { setFeedback('Preencha nome, e-mail válido e mensagem.'); return; }
    setSending(true); setFeedback('');
    try {
      const form = contactForm(values);
      const response = await fetch(ENDPOINT, { method: 'POST', body: form, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Falha no envio');
      setFeedback('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      setName(''); setEmail(''); setMessage(''); setSubject(subjects[0]);
    } catch { setFeedback('Erro ao enviar. Verifique sua conexão e tente novamente.'); }
    finally { setSending(false); }
  };
  return <View style={[styles.section, contrast && { backgroundColor: '#000' }]}>
    <View style={styles.inner}><View style={styles.info}>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: 44 * fontScale }, contrast && { color: '#fff' }]}>FALE CONOSCO</Text>
      <Text style={[styles.text, contrast && { color: '#fff' }]}>Estamos à disposição para esclarecer dúvidas sobre treinos, parcerias ou doações.</Text>
      <Text style={styles.label}>CENTRO DE TREINAMENTO</Text><Text style={[styles.text, contrast && { color: '#fff' }]}>R. Ana Maria Ferreira Baltazar, 705 — Jardim Shangri-La, Itapetininga — SP, 18208-580</Text>
      <Text style={styles.label}>E-MAIL</Text><Pressable accessibilityRole="link" onPress={() => void Linking.openURL('mailto:contato@ecitapetininga.com.br')}><Text style={styles.link}>contato@ecitapetininga.com.br</Text></Pressable>
      <Text style={styles.label}>INSTAGRAM</Text><Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.instagram.com/ecitape_oficial/')}><Text style={styles.link}>@ecitape_oficial</Text></Pressable>
      <Text style={styles.label}>ATENDIMENTO</Text><Text style={[styles.text, contrast && { color: '#fff' }]}>Seg. a Sex., 9h às 17h</Text>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.google.com/maps/search/?api=1&query=Rua+Ana+Maria+Ferreira+Baltazar+705+Itapetininga')}><Text style={styles.link}>Abrir localização no mapa →</Text></Pressable>
    </View>
    <View style={styles.form}><Text style={styles.formTitle}>ENVIE UMA MENSAGEM</Text>
      <Text style={styles.fieldLabel}>NOME COMPLETO</Text><TextInput accessibilityLabel="Nome completo" value={name} onChangeText={setName} placeholder="Como podemos te chamar?" style={styles.input} />
      <Text style={styles.fieldLabel}>E-MAIL</Text><TextInput accessibilityLabel="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <Text style={styles.fieldLabel}>ASSUNTO</Text><View style={styles.subjects}>{subjects.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: subject === item }} onPress={() => setSubject(item)} style={[styles.subject, subject === item && styles.subjectActive]}><Text style={subject === item ? styles.subjectTextActive : styles.subjectText}>{item}</Text></Pressable>)}</View>
      <Text style={styles.fieldLabel}>MENSAGEM</Text><TextInput accessibilityLabel="Mensagem" value={message} onChangeText={setMessage} placeholder="Escreva sua mensagem..." multiline numberOfLines={5} style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]} />
      <Pressable disabled={sending} accessibilityRole="button" onPress={() => void submit()} style={[styles.submit, sending && { opacity: .6 }]}><Text style={styles.submitText}>{sending ? 'ENVIANDO...' : 'ENVIAR MENSAGEM'}</Text></Pressable>
      {!!feedback && <Text accessibilityRole="alert" style={[styles.feedback, { color: feedback.startsWith('Mensagem enviada') ? '#147344' : '#b42318' }]}>{feedback}</Text>}
    </View></View>
  </View>;
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#f7f8fb', paddingVertical: 70, paddingHorizontal: 24 }, inner: { maxWidth: 1120, width: '100%', alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 44 }, info: { flexGrow: 1, flexBasis: 300 }, form: { flexGrow: 1, flexBasis: 350, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 24 },
  title: { fontFamily: fonts.display, color: colors.navy, marginBottom: 18 }, text: { color: colors.muted, fontFamily: fonts.body, lineHeight: 25, marginBottom: 20 }, label: { color: colors.navy, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1, marginBottom: 5 }, link: { color: colors.blue, fontFamily: fonts.medium, textDecorationLine: 'underline', marginBottom: 18 }, formTitle: { color: colors.navy, fontFamily: fonts.condensed, fontSize: 26, marginBottom: 14 }, fieldLabel: { color: colors.navy, fontFamily: fonts.bold, fontSize: 12, marginBottom: 7, marginTop: 10 }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 5, backgroundColor: '#fff', padding: 14, fontFamily: fonts.body, fontSize: 16 }, subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, subject: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 4 }, subjectActive: { backgroundColor: colors.navy, borderColor: colors.navy }, subjectText: { color: colors.navy, fontFamily: fonts.medium, fontSize: 12 }, subjectTextActive: { color: '#fff', fontFamily: fonts.medium, fontSize: 12 }, submit: { backgroundColor: colors.navy, padding: 16, alignItems: 'center', marginTop: 22, borderRadius: 4 }, submitText: { color: '#fff', fontFamily: fonts.condensed, fontSize: 20, letterSpacing: 1 }, feedback: { fontFamily: fonts.medium, marginTop: 12 },
});
