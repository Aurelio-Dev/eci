import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import pages from '../data/webPages.json';
import { NativeStructuredContent } from '../components/NativeStructuredContent';
import { PageShell } from '../components/Shell';
import { colors, fonts } from '../lib/theme';
type Page = { title: string };
const allPages = pages as Record<string, Page>;
export function generateStaticParams() { return Object.keys(allPages).map(slug => ({ slug })); }

export default function ArticlePage() {
  const { slug, section } = useLocalSearchParams<{ slug: string; section?: string }>();
  const page = allPages[slug] || allPages['404'];
  const scroll = useRef<ScrollView | null>(null);
  const anchorPositions = useRef<Record<string, number>>({});
  const [category, setCategory] = useState('sub15');
  const roster = slug === 'elenco';
  useEffect(() => { if (section && anchorPositions.current[section] !== undefined) scroll.current?.scrollTo({ y: anchorPositions.current[section], animated: true }); }, [section]);
  return <PageShell onScrollRef={node => { scroll.current = node; }}>
    <Head><title>{page.title}</title></Head>
    {roster && <View style={styles.filters}>{['sub15', 'sub17', 'sub20'].map(value => <Pressable key={value} onPress={() => setCategory(value)} accessibilityRole="button" accessibilityState={{ selected: category === value }} style={[styles.filter, category === value && styles.filterActive]}><Text style={[styles.filterText, category === value && { color: colors.navy }]}>{value.replace('sub', 'SUB-')}</Text></Pressable>)}</View>}
    {slug === 'loja' && <Text style={styles.notice}>LOJA EM CONSTRUÇÃO — produtos e compra ainda não estão disponíveis.</Text>}
    <NativeStructuredContent slug={slug} category={category} onAnchor={(id, y) => { anchorPositions.current[id] = y; if (section === id) setTimeout(() => scroll.current?.scrollTo({ y, animated: true }), 80); }} />
  </PageShell>;
}

const styles = StyleSheet.create({ filters: { backgroundColor: colors.navy, flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 20 }, filter: { paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: colors.gold }, filterActive: { backgroundColor: colors.gold }, filterText: { color: '#fff', fontFamily: fonts.bold }, notice: { backgroundColor: '#fff4c4', color: colors.navy, fontFamily: fonts.bold, padding: 16, textAlign: 'center' } });
