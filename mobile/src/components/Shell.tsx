import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Image, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { usePathname } from 'expo-router';
import { openHref } from '../lib/navigation';
import { colors, fonts } from '../lib/theme';
import VLibras from './VLibras';

type AppState = {
  contrast: boolean; fontScale: number; openSupport: () => void;
  setReadableText: (text: string) => void;
};
const Context = createContext<AppState | null>(null);
export function useApp() {
  const state = useContext(Context);
  if (!state) throw new Error('AppProvider missing');
  return state;
}

const NAV = [
  { label: 'INÍCIO', href: 'index.html#hero' },
  { label: 'O CLUBE', children: [
    { label: 'Nossa História', href: 'index.html#history' },
    { label: 'Diretoria', href: 'diretoria.html' },
    { label: 'Governança', href: 'governanca.html' },
    { label: 'Infraestrutura', href: 'infraestrutura.html' },
    { label: 'Código de Ética', href: 'etica.html' },
    { label: 'Transparência', href: 'transparencia.html' },
  ] },
  { label: 'BASE', children: [
    { label: 'Categorias', href: 'index.html#categories' },
    { label: 'Elenco', href: 'elenco.html' },
    { label: 'Comissão Técnica', href: 'comissao.html' },
    { label: 'Metodologia', href: 'metodologia.html' },
    { label: 'Peneiras', href: 'peneiras.html' },
  ] },
  { label: 'PROJETO SOCIAL', href: 'index.html#pilar-iniciacao' },
  { label: 'LOJA', href: 'loja.html' },
  { label: 'CONTATO', href: 'index.html#contact' },
];

function Action({ label, onPress, filled = false }: { label: string; onPress: () => void; filled?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.action, filled && styles.actionFilled]}>
    <Text style={[styles.actionText, filled && styles.actionTextFilled]}>{label}</Text>
  </Pressable>;
}

function Header() {
  const { width } = useWindowDimensions();
  const desktop = width >= 1450;
  const { openSupport } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const go = (href: string) => { setMenuOpen(false); setDropdown(null); void openHref(href, openSupport); };
  return <View style={styles.header}>
    <View style={[styles.headerInner, !desktop && { minHeight: 74, paddingHorizontal: 12, gap: 6 }]}>
      <Pressable onPress={() => go('index.html')} accessibilityRole="link" accessibilityLabel="Página inicial do EC Itapetininga" style={[styles.brand, !desktop && { minWidth: 0, flexShrink: 1, gap: 5 }]}>
        <Image source={require('../../assets/images/eci.png')} style={[styles.brandLogo, !desktop && { width: 42, height: 48 }]} resizeMode="contain" />
        <View><Text style={[styles.brandTitle, !desktop && { fontSize: 17, letterSpacing: 0 }]} numberOfLines={1}>EC ITAPETININGA</Text><Text style={[styles.brandSince, !desktop && { fontSize: 11 }]}>DESDE 1950</Text></View>
      </Pressable>
      {desktop ? <View style={styles.nav}>
        {NAV.map(item => <View key={item.label} style={styles.navItem}>
          <Pressable accessibilityRole={item.children ? 'button' : 'link'} accessibilityState={item.children ? { expanded: dropdown === item.label } : undefined} onPress={() => item.children ? setDropdown(dropdown === item.label ? null : item.label) : go(item.href!)}>
            <Text style={styles.navText}>{item.label}{item.children ? '  ⌄' : ''}</Text>
          </Pressable>
          {item.children && dropdown === item.label && <View style={styles.dropdown}>{item.children.map(child => <Pressable key={child.href} onPress={() => go(child.href)} style={styles.dropdownItem} accessibilityRole="link"><Text style={styles.dropdownText}>{child.label}</Text></Pressable>)}</View>}
        </View>)}
      </View> : <Pressable onPress={() => setMenuOpen(!menuOpen)} accessibilityRole="button" accessibilityLabel={menuOpen ? 'Fechar menu' : 'Abrir menu'} accessibilityState={{ expanded: menuOpen }} style={styles.menuButton}><Text style={styles.menuGlyph}>{menuOpen ? '✕' : '☰'}</Text></Pressable>}
      <Pressable onPress={() => go('login.html')} accessibilityRole="link" accessibilityLabel="Área administrativa"><Text style={[styles.adminLink, !desktop && { fontSize: 12, letterSpacing: 0 }]}>{desktop ? 'ÁREA ADMINISTRATIVA' : 'ADMIN'}</Text></Pressable>
      {desktop && <Action label="APOIE O CLUBE  →" onPress={openSupport} filled />}
    </View>
    {!desktop && menuOpen && <ScrollView style={styles.mobileMenu}>
      {NAV.map(item => item.children ? <View key={item.label}><Text style={styles.mobileGroup}>{item.label}</Text>{item.children.map(child => <Pressable key={child.href} style={styles.mobileLink} onPress={() => go(child.href)}><Text style={styles.mobileText}>{child.label}</Text></Pressable>)}</View> : <Pressable key={item.label} style={styles.mobileLink} onPress={() => go(item.href!)}><Text style={styles.mobileText}>{item.label}</Text></Pressable>)}
      <Pressable style={styles.mobileLink} onPress={() => go('login.html')}><Text style={styles.mobileText}>ÁREA ADMINISTRATIVA</Text></Pressable>
      <View style={{ padding: 18 }}><Action label="APOIE O CLUBE  →" filled onPress={() => { setMenuOpen(false); openSupport(); }} /></View>
    </ScrollView>}
  </View>;
}

function Footer() {
  const { openSupport } = useApp();
  const go = (href: string) => void openHref(href, openSupport);
  const items = [
    ['Nossa História', 'index.html#history'], ['Diretoria', 'diretoria.html'], ['Categorias de Base', 'index.html#categories'],
    ['Projeto Social', 'index.html#pilar-iniciacao'], ['Governança', 'governanca.html'], ['Transparência', 'transparencia.html'],
    ['Código de Ética', 'etica.html'], ['Política de Privacidade', 'privacidade.html'], ['Contato', 'index.html#contact'],
  ];
  return <View style={styles.footer}><View style={styles.footerInner}>
    <Image source={require('../../assets/images/eci.png')} style={{ width: 72, height: 72 }} resizeMode="contain" />
    <Text style={styles.footerTitle}>EC ITAPETININGA</Text>
    <Text style={styles.footerBody}>Formando atletas e cidadãos desde 1950. O maior patrimônio esportivo de Itapetininga.</Text>
    <Text style={styles.footerBody}>CNPJ: 01.077.813/0001-42</Text>
    <View style={styles.footerLinks}>{items.map(([label, href]) => <Pressable key={href} onPress={() => go(href)} accessibilityRole="link"><Text style={styles.footerLink}>{label}</Text></Pressable>)}</View>
    <Pressable onPress={() => void Linking.openURL('https://www.instagram.com/ecitape_oficial/')} accessibilityRole="link"><Text style={styles.footerLink}>Instagram @ecitape_oficial</Text></Pressable>
    <Pressable onPress={() => void Share.share({ message: 'Esporte Clube Itapetininga — https://www.instagram.com/ecitape_oficial/' })} accessibilityRole="button"><Text style={styles.footerLink}>Compartilhar</Text></Pressable>
    <Text style={styles.footerCopyright}>© 2026 Esporte Clube Itapetininga. Todos os direitos reservados.</Text>
  </View></View>;
}

function SupportModal({ visible, close }: { visible: boolean; close: () => void }) {
  const [copied, setCopied] = useState(false);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close} accessibilityViewIsModal>
    <View style={styles.modalBackdrop}><View style={styles.modalPanel}>
      <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Fechar apoio" style={styles.modalClose}><Text style={{ fontSize: 24 }}>×</Text></Pressable>
      <Image source={require('../../assets/images/time6.png')} style={styles.modalImage} resizeMode="cover" />
      <View style={{ padding: 24 }}>
        <Text style={styles.eyebrow}>IMPACTO SOCIAL</Text>
        <Text style={styles.modalTitle}>Apoie os sonhos da nossa base</Text>
        <Text style={styles.body}>Seu apoio fomenta a inclusão e o desenvolvimento de talentos locais e regionais.</Text>
        <Text style={styles.body}>Sua contribuição ajuda jovens a acessar treinos, equipamentos e suporte social.</Text>
        <Pressable onPress={async () => { await Clipboard.setStringAsync('01.077.813/0001-42'); setCopied(true); }} style={styles.pix} accessibilityRole="button" accessibilityLabel="Copiar chave PIX CNPJ 01.077.813/0001-42"><Text style={styles.pixText}>PIX / CNPJ{ '\n' }01.077.813/0001-42  ⧉</Text></Pressable>
        {copied && <Text accessibilityRole="alert" style={styles.copied}>Chave PIX copiada.</Text>}
        <Text style={styles.body}>Entre em contato para planos de patrocínio empresarial.</Text>
        <Action label="FECHAR" filled onPress={close} />
      </View>
    </View></View>
  </Modal>;
}

function Accessibility() {
  const { contrast, fontScale } = useApp();
  const state = useContext(ControlsContext)!;
  const [open, setOpen] = useState(false);
  const [largeCursor, setLargeCursor] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || !largeCursor) return;
    const style = document.createElement('style');
    style.textContent = '* { cursor: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Cpath d=\'M4 2 L18 43 L25 26 L43 19 Z\' fill=\'white\' stroke=\'black\' stroke-width=\'3\'/%3E%3C/svg%3E") 4 2, auto !important; }';
    document.head.appendChild(style);
    return () => style.remove();
  }, [largeCursor]);
  const say = (selected: boolean) => {
    let text = state.readableText;
    if (selected && Platform.OS === 'web' && typeof window !== 'undefined') text = window.getSelection()?.toString() || '';
    if (!text) { state.setNotice(selected ? 'Selecione um texto primeiro.' : 'Nenhum texto disponível.'); return; }
    Speech.stop(); Speech.speak(text.slice(0, 12000), { language: 'pt-BR' });
  };
  return <View style={styles.accessibility} pointerEvents="box-none">
    {open && <View style={[styles.accessibilityPanel, contrast && { backgroundColor: '#000' }]}>
      <Text style={[styles.accessibilityTitle, contrast && { color: '#fff' }]}>ACESSIBILIDADE</Text>
      <Action label="Alto contraste" onPress={() => state.setContrast(!contrast)} />
      <Action label={`Aumentar fonte (${Math.round(fontScale * 100)}%)`} onPress={() => state.setFontScale(Math.min(1.5, +(fontScale + .1).toFixed(1)))} />
      <Action label="Diminuir fonte" onPress={() => state.setFontScale(Math.max(.7, +(fontScale - .1).toFixed(1)))} />
      {Platform.OS === 'web' && <Action label={largeCursor ? 'Cursor normal' : 'Cursor maior'} onPress={() => setLargeCursor(!largeCursor)} />}
      <Action label="Ler página" onPress={() => say(false)} />
      {Platform.OS === 'web' && <Action label="Ler seleção" onPress={() => say(true)} />}
      <Action label="Parar leitura" onPress={() => Speech.stop()} />
      {Platform.OS !== 'web' && <Action label="Abrir VLibras" onPress={() => void Linking.openURL('https://vlibras.gov.br/')} />}
      {!!state.notice && <Text accessibilityRole="alert">{state.notice}</Text>}
    </View>}
    <Pressable style={styles.accessibilityButton} onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityLabel="Ferramentas de acessibilidade" accessibilityState={{ expanded: open }}><Text style={{ color: '#fff', fontSize: 25 }}>♿</Text></Pressable>
  </View>;
}

type Controls = { contrast: boolean; setContrast: (v: boolean) => void; setFontScale: (v: number) => void; readableText: string; setNotice: (v: string) => void; notice: string };
const ControlsContext = createContext<Controls | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [contrast, setContrast] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [support, setSupport] = useState(false);
  const [readableText, setReadableText] = useState('');
  const [notice, setNotice] = useState('');
  const appState = useMemo(() => ({ contrast, fontScale, openSupport: () => setSupport(true), setReadableText }), [contrast, fontScale]);
  return <SafeAreaProvider><Context.Provider value={appState}><ControlsContext.Provider value={{ contrast, setContrast, setFontScale, readableText, setNotice, notice }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={['top', 'bottom']}>
      {children}<Accessibility /><SupportModal visible={support} close={() => setSupport(false)} /><VLibras />
    </SafeAreaView>
  </ControlsContext.Provider></Context.Provider></SafeAreaProvider>;
}

export function PageShell({ children, onScrollRef, includeFooter = true }: { children: ReactNode; onScrollRef?: (node: ScrollView | null) => void; includeFooter?: boolean }) {
  const { contrast } = useApp();
  const pathname = usePathname();
  return <View style={{ flex: 1, backgroundColor: contrast ? '#000' : colors.white }}><Header key={pathname} /><ScrollView ref={onScrollRef} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
    {children}{includeFooter && <Footer />}
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, zIndex: 10 },
  headerInner: { minHeight: 94, maxWidth: 1600, width: '100%', alignSelf: 'center', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 220 },
  brandLogo: { width: 58, height: 65 },
  brandTitle: { color: '#fff', fontFamily: fonts.condensed, fontSize: 22, letterSpacing: 2 },
  brandSince: { color: colors.gold, fontFamily: fonts.condensed, fontSize: 14, letterSpacing: 2 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 22 }, navItem: { position: 'relative', justifyContent: 'center', minHeight: 94 },
  navText: { color: '#e2e7f3', fontFamily: fonts.condensed, fontSize: 17, letterSpacing: 2 }, adminLink: { color: '#fff', fontFamily: fonts.condensed, letterSpacing: 1, fontSize: 15, textDecorationLine: 'underline' },
  dropdown: { position: 'absolute', top: 75, left: 0, minWidth: 230, backgroundColor: '#fff', borderRadius: 5, shadowColor: '#000', shadowOpacity: .2, shadowRadius: 12, elevation: 8, paddingVertical: 6 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 16 }, dropdownText: { color: colors.ink, fontFamily: fonts.medium, fontSize: 14 },
  action: { borderWidth: 1, borderColor: colors.gold, borderRadius: 2, paddingHorizontal: 18, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  actionFilled: { backgroundColor: colors.gold }, actionText: { fontFamily: fonts.condensed, color: colors.gold, fontSize: 17, letterSpacing: 2 }, actionTextFilled: { color: colors.navy },
  menuButton: { padding: 12 }, menuGlyph: { fontSize: 28, color: '#fff' }, mobileMenu: { maxHeight: 550, backgroundColor: '#06143b' }, mobileGroup: { color: colors.gold, fontFamily: fonts.condensed, fontSize: 18, paddingHorizontal: 24, paddingTop: 16 }, mobileLink: { paddingHorizontal: 24, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#183265' }, mobileText: { color: '#fff', fontFamily: fonts.medium },
  footer: { backgroundColor: colors.navy, padding: 32 }, footerInner: { maxWidth: 1120, width: '100%', alignSelf: 'center', gap: 12 }, footerTitle: { color: '#fff', fontFamily: fonts.condensed, fontSize: 26, letterSpacing: 2 }, footerBody: { color: '#dce3f0', fontFamily: fonts.body, lineHeight: 23 }, footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingVertical: 20 }, footerLink: { color: '#fff', fontFamily: fonts.medium, textDecorationLine: 'underline' }, footerCopyright: { color: '#a9b5ce', fontFamily: fonts.body, fontSize: 12, marginTop: 20 },
  modalBackdrop: { flex: 1, backgroundColor: '#061a4bc9', justifyContent: 'center', alignItems: 'center', padding: 18 }, modalPanel: { width: '100%', maxWidth: 620, maxHeight: '95%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }, modalClose: { position: 'absolute', top: 8, right: 12, zIndex: 2, backgroundColor: '#fff', borderRadius: 22, width: 40, height: 40, alignItems: 'center' }, modalImage: { width: '100%', height: 160 }, eyebrow: { color: '#ad8800', fontFamily: fonts.bold, letterSpacing: 2, marginBottom: 8 }, modalTitle: { color: colors.navy, fontFamily: fonts.display, fontSize: 42 }, body: { color: colors.muted, fontFamily: fonts.body, lineHeight: 23, marginBottom: 14 }, pix: { backgroundColor: colors.pale, borderWidth: 1, borderColor: colors.border, padding: 14, marginVertical: 10 }, pixText: { color: colors.navy, fontFamily: fonts.bold, lineHeight: 25 }, copied: { color: '#167344', fontFamily: fonts.medium, marginBottom: 8 },
  accessibility: { position: 'absolute', right: 12, top: '45%', alignItems: 'flex-end', zIndex: 30, gap: 8 }, accessibilityButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#2876df', elevation: 5 }, accessibilityPanel: { backgroundColor: '#fff', padding: 12, borderRadius: 8, width: 230, gap: 7, elevation: 6, shadowColor: '#000', shadowOpacity: .2, shadowRadius: 8 }, accessibilityTitle: { color: colors.navy, fontFamily: fonts.bold },
});
