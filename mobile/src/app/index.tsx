import { useEffect, useRef } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { NativeStructuredContent } from '../components/NativeStructuredContent';
import { Contact } from '../components/Contact';
import { PageShell, useApp } from '../components/Shell';
import { colors, fonts } from '../lib/theme';

export default function Home() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const scroll = useRef<ScrollView | null>(null);
  const anchorPositions = useRef<Record<string, number>>({});
  const { width } = useWindowDimensions();
  const heroHeight = width >= 800 ? 680 : 590;
  const titleSize = width >= 800 ? 112 : Math.min(64, Math.floor((width - 40) * .15));
  const { openSupport, contrast } = useApp();
  const anchor = (id: string, y: number) => { anchorPositions.current[id] = y; if (section === id) setTimeout(() => scroll.current?.scrollTo({ y, animated: true }), 80); };
  useEffect(() => { if (section && anchorPositions.current[section] !== undefined) scroll.current?.scrollTo({ y: anchorPositions.current[section], animated: true }); }, [section]);
  return <PageShell onScrollRef={node => { scroll.current = node; }}>
    <Head><title>Esporte Clube Itapetininga</title><meta name="description" content="Conheça a história, a base e os projetos sociais do EC Itapetininga." /></Head>
    <ImageBackground source={require('../../assets/images/testehero.jpeg')} resizeMode="cover" imageStyle={width < 800 ? { transform: [{ scale: 1.2 }, { translateY: -45 }] } : undefined} style={[styles.hero, { minHeight: heroHeight }]} accessibilityLabel="Equipe do EC Itapetininga reunida no campo">
      <View style={styles.heroOverlay} />
      <View style={[styles.heroContent, width < 800 && { paddingHorizontal: 20 }]}>
        <View style={styles.heroRule} />
        <Text style={[styles.heroTitle, { fontSize: titleSize, lineHeight: titleSize * .86 }]}>ESPORTE CLUBE</Text>
        <Text style={[styles.heroTitle, styles.heroGold, { fontSize: titleSize, lineHeight: titleSize * .86 }]}>ITAPETININGA</Text>
        <Text style={styles.heroSubtitle}>—  FILIADO À FEDERAÇÃO PAULISTA DE FUTEBOL  —</Text>
        <View style={styles.heroActions}>
          <Pressable onPress={openSupport} accessibilityRole="button" style={styles.heroPrimary}><Text style={styles.heroPrimaryText}>COMO APOIAR  →</Text></Pressable>
          <Pressable onPress={() => scroll.current?.scrollTo({ y: heroHeight, animated: true })} accessibilityRole="link" style={styles.heroSecondary}><Text style={styles.heroSecondaryText}>CONHEÇA A HISTÓRIA</Text></Pressable>
        </View>
      </View>
    </ImageBackground>
    <NativeStructuredContent onAnchor={(id, y) => anchor(id, heroHeight + y)} />
    <View onLayout={e => anchor('contact', e.nativeEvent.layout.y)}><Contact /></View>
    <View style={[styles.supportBand, contrast && { backgroundColor: '#000' }]}><Text style={styles.supportBandTitle}>FAÇA PARTE DESSA HISTÓRIA</Text><Pressable onPress={openSupport} style={styles.heroPrimary}><Text style={styles.heroPrimaryText}>APOIE O CLUBE  →</Text></Pressable></View>
  </PageShell>;
}

const styles = StyleSheet.create({
  hero: { width: '100%', justifyContent: 'center', backgroundColor: colors.navy }, heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: '#061a4bbf' }, heroContent: { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 32, paddingVertical: 70 }, heroRule: { position: 'absolute', width: 4, height: 250, backgroundColor: colors.gold, left: 12, top: 80 }, heroTitle: { color: '#fff', fontFamily: fonts.display, letterSpacing: 0 }, heroGold: { color: colors.gold, marginTop: 4 }, heroSubtitle: { color: colors.gold, fontFamily: fonts.condensed, fontSize: 20, marginTop: 12, marginBottom: 18 }, heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 }, heroPrimary: { backgroundColor: colors.gold, paddingHorizontal: 32, paddingVertical: 17, minWidth: 230, alignItems: 'center' }, heroPrimaryText: { color: colors.navy, fontFamily: fonts.condensed, fontSize: 22, letterSpacing: 2 }, heroSecondary: { borderWidth: 2, borderColor: '#fff', paddingHorizontal: 32, paddingVertical: 15, alignItems: 'center' }, heroSecondaryText: { color: '#fff', fontFamily: fonts.condensed, fontSize: 22, letterSpacing: 2 }, supportBand: { padding: 40, backgroundColor: colors.blue, alignItems: 'center', gap: 18 }, supportBandTitle: { color: '#fff', fontFamily: fonts.display, fontSize: 38, textAlign: 'center' },
});
