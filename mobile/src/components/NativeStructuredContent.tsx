import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import webPages from '../data/webPages.json';
import { imageSources } from '../data/imageSources';
import { openHref } from '../lib/navigation';
import { colors, fonts } from '../lib/theme';
import { useApp } from './Shell';

type Node = string | { tag: string; props: Record<string, unknown>; children: Node[] };
type Page = { body: Node[] };
const pages = webPages as Record<string, Page>;
const hiddenClasses = new Set(['sr-only', 'material-symbols-outlined', 'accessibility-panel', 'support-modal']);
const textTags = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'span', 'small', 'strong', 'em', 'b', 'i', 'blockquote', 'figcaption', 'label', 'time', 'code']);

function classes(node: Exclude<Node, string>) { return String(node.props.className || '').split(/\s+/); }
function textOf(node: Node): string { return typeof node === 'string' ? node : node.children.map(textOf).join(' '); }
function findMain(nodes: Node[]): Node | undefined {
  for (const node of nodes) {
    if (typeof node === 'string') continue;
    if (node.tag === 'main') return node;
    const found = findMain(node.children);
    if (found) return found;
  }
}
function homeSections(nodes: Node[]): Node[] {
  const sections: Node[] = [];
  const walk = (node: Node) => {
    if (typeof node === 'string') return;
    if (node.tag === 'section' && classes(node).some(name => ['history-editorial', 'legends-editorial-section', 'archive-section', 'nova-base-page'].includes(name))) {
      sections.push(node);
      return;
    }
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return sections;
}

export function NativeStructuredContent({ slug = 'index', category = 'sub15', onAnchor }: { slug?: string; category?: string; onAnchor?: (id: string, y: number) => void }) {
  const { width } = useWindowDimensions();
  const { openSupport, contrast, fontScale, setReadableText } = useApp();
  const page = pages[slug] || pages['404'];
  const roots = useMemo(() => {
    const main = findMain(page.body);
    if (main && typeof main !== 'string') return slug === 'index' ? homeSections(main.children) : main.children;
    return page.body.filter(node => typeof node !== 'string' && !['header', 'footer', 'nav'].includes(node.tag));
  }, [page, slug]);
  useEffect(() => { setReadableText(roots.map(textOf).join('. ').slice(0, 15000)); }, [roots, setReadableText]);

  const renderInline = (node: Node, key: string, tone: 'light' | 'dark'): ReactNode => {
    if (typeof node === 'string') return node.replace(/\s+/g, ' ');
    if (node.tag === 'br') return '\n';
    if (classes(node).some(name => hiddenClasses.has(name)) || node.props['aria-hidden'] === 'true') return null;
    const textStyle: TextStyle = { color: tone === 'dark' ? '#fff' : colors.ink };
    if (['strong', 'b'].includes(node.tag)) textStyle.fontFamily = fonts.bold;
    if (['em', 'i'].includes(node.tag)) textStyle.fontStyle = 'italic';
    if (node.tag === 'a') {
      textStyle.color = tone === 'dark' ? colors.gold : colors.blue;
      textStyle.textDecorationLine = 'underline';
    }
    return <Text key={key} style={textStyle} onPress={node.tag === 'a' && node.props.href ? () => void openHref(String(node.props.href).replace(/^\//, ''), openSupport, slug) : undefined}>{node.children.map((child, index) => renderInline(child, `${key}-${index}`, tone))}</Text>;
  };

  const renderNode = (node: Node, key: string, inheritedTone: 'light' | 'dark' = 'light', inGrid = false): ReactNode => {
    if (typeof node === 'string') return node.trim() ? <Text key={key} style={[styles.bodyText, { color: inheritedTone === 'dark' ? '#fff' : colors.ink, fontSize: 16 * fontScale }]}>{node.trim()}</Text> : null;
    const css = classes(node);
    if (css.some(name => hiddenClasses.has(name)) || node.props['aria-hidden'] === 'true') return null;
    if (node.tag === 'script' || node.tag === 'style' || node.tag === 'iframe' || node.tag === 'form') return null;
    const id = String(node.props.id || '');
    if (slug === 'index' && (id === 'hero' || id === 'contact')) return null;
    if (slug === 'elenco' && id && ['sub15', 'sub17', 'sub20'].includes(id) && id !== category) return null;
    if (css.includes('filtros') || css.includes('btn-filtro')) return null;

    let tone = inheritedTone;
    const viewStyle: ViewStyle = {};
    if (['section', 'main'].includes(node.tag)) Object.assign(viewStyle, styles.section);
    if (css.includes('history-editorial')) Object.assign(viewStyle, styles.history);
    if (css.includes('legends-editorial-section')) Object.assign(viewStyle, styles.legends);
    if (css.includes('archive-section')) Object.assign(viewStyle, styles.archive);
    if (css.includes('nova-base-page') || css.includes('academy-section')) Object.assign(viewStyle, styles.academy);
    if (css.includes('nova-base-page-2')) viewStyle.backgroundColor = '#12285a';
    if (css.includes('page-header') || css.includes('bg-primary-container') || css.includes('bg-[#12234e]')) Object.assign(viewStyle, styles.darkSection);
    if (css.includes('bg-gray-100') || css.includes('bg-gray-50') || css.includes('bg-surface-container-low')) viewStyle.backgroundColor = '#f3f5f9';
    if (css.includes('history-milestone') || css.includes('archive-card') || css.includes('nova-base-box') || css.includes('card-atleta') || css.includes('transp-doc-card')) Object.assign(viewStyle, styles.card);
    if (css.includes('legend-editorial-piece')) Object.assign(viewStyle, styles.legendCard);
    if (css.includes('history-story-grid') || css.includes('nova-base-grid-2') || css.includes('nova-base-grid-layout') || css.includes('nova-base-grid-3') || css.includes('grid') || css.includes('archive-track') || css.includes('legends-editorial-wall')) {
      if (width >= 700) Object.assign(viewStyle, styles.grid);
      else viewStyle.gap = 16;
    }
    if (css.includes('max-w-7xl') || css.includes('nova-base-container') || css.includes('history-story') || css.includes('archive-inner') || css.includes('legends-editorial-inner')) Object.assign(viewStyle, styles.maxWidth);
    if (css.includes('nova-base-box-amarelo')) Object.assign(viewStyle, styles.yellowBox);
    if (inGrid && !textTags.has(node.tag)) Object.assign(viewStyle, styles.gridChild);
    if (contrast) { viewStyle.backgroundColor = '#000'; viewStyle.borderColor = '#fff'; }
    if (viewStyle.backgroundColor === colors.navy || viewStyle.backgroundColor === colors.blue || viewStyle.backgroundColor === '#0b1c3f' || viewStyle.backgroundColor === '#12285a') tone = 'dark';

    if (node.tag === 'img') {
      const src = String(node.props.src || '').replace(/^\//, '');
      const source = imageSources[src];
      if (!source) return null;
      return <Image key={key} source={source} resizeMode="cover" accessibilityLabel={String(node.props.alt || 'Imagem do EC Itapetininga')} style={[styles.image, css.includes('site-brand-logo') && styles.smallImage]} />;
    }
    if (textTags.has(node.tag) || ['li', 'th', 'td'].includes(node.tag)) {
      const heading = /^h[1-5]$/.test(node.tag);
      const level = Number(node.tag[1]);
      const color = tone === 'dark' ? '#fff' : colors.ink;
      const style: TextStyle = { color, fontFamily: heading ? fonts.condensed : fonts.body, fontSize: (heading ? level === 1 ? 50 : level === 2 ? 38 : level === 3 ? 27 : 21 : 16) * fontScale, lineHeight: heading ? undefined : 25 * fontScale, marginBottom: heading ? 14 : 11 };
      if (css.some(name => name.includes('kicker') || name.includes('label'))) { style.color = colors.gold; style.fontFamily = fonts.bold; style.fontSize = 15 * fontScale; }
      if (css.includes('nova-base-title') || css.includes('history-story-hero')) { style.fontFamily = fonts.display; style.fontSize = (width > 700 ? 64 : 50) * fontScale; }
      if (node.tag === 'li') style.marginLeft = 15;
      if (node.tag === 'blockquote') { style.borderLeftWidth = 4; style.borderLeftColor = colors.gold; style.paddingLeft = 12; }
      return <Text key={key} onLayout={event => id && slug !== 'index' && onAnchor?.(id, event.nativeEvent.layout.y)} accessibilityRole={heading ? 'header' : undefined} style={style}>{node.tag === 'li' ? '•  ' : ''}{node.children.map((child, index) => renderInline(child, `${key}-${index}`, tone))}</Text>;
    }
    if (node.tag === 'a' || node.tag === 'button') {
      const href = String(node.props.href || '');
      if (!href || href === '#') return null;
      const blockChildren = node.children.some(child => typeof child !== 'string' && ['div', 'img', 'article'].includes(child.tag));
      return <Pressable key={key} accessibilityRole="link" onPress={() => void openHref(href.replace(/^\//, ''), openSupport, slug)} style={[styles.link, css.includes('nova-base-box') && styles.card]}>
        {blockChildren ? node.children.map((child, index) => renderNode(child, `${key}-${index}`, tone)) : <Text style={[styles.linkText, { fontSize: 18 * fontScale }]}>{textOf(node).replace(/\b(arrow_forward|shopping_cart|arrow_upward|home)\b/g, '').trim()} →</Text>}
      </Pressable>;
    }
    const grid = width >= 700 && (css.includes('grid') || css.includes('archive-track') || css.includes('legends-editorial-wall') || css.includes('history-story-copy') || css.includes('nova-base-grid-3'));
    return <View key={key} onLayout={event => id && slug !== 'index' && onAnchor?.(id, event.nativeEvent.layout.y)} style={viewStyle}>
      {node.children.map((child, index) => renderNode(child, `${key}-${index}`, tone, grid))}
    </View>;
  };

  return <View style={[styles.root, contrast && { backgroundColor: '#000' }]}>{roots.map((node, index) => <View key={`root-${index}`} onLayout={event => {
    if (slug !== 'index' || typeof node === 'string') return;
    const y = event.nativeEvent.layout.y;
    const id = String(node.props.id || '');
    if (id) onAnchor?.(id, y);
    if (classes(node).includes('nova-base-page-1')) onAnchor?.('categories', y);
  }}>{renderNode(node, `section-${index}`)}</View>)}</View>;
}

const styles = StyleSheet.create({
  root: { width: '100%', backgroundColor: '#fff' },
  section: { width: '100%', paddingVertical: 38, paddingHorizontal: 20, gap: 10 },
  history: { backgroundColor: '#f7f8fb', paddingVertical: 42, paddingHorizontal: 20, gap: 16 },
  legends: { backgroundColor: colors.navy, paddingVertical: 45, paddingHorizontal: 20, gap: 18 },
  archive: { backgroundColor: colors.blue, paddingVertical: 45, paddingHorizontal: 20, gap: 18 },
  academy: { backgroundColor: '#0b1c3f', paddingVertical: 44, paddingHorizontal: 20, gap: 16 },
  darkSection: { backgroundColor: colors.navy, paddingVertical: 35, paddingHorizontal: 20, gap: 12 },
  maxWidth: { maxWidth: 1120, width: '100%', alignSelf: 'center', gap: 14 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, borderTopColor: colors.gold, padding: 16, marginBottom: 10, gap: 5 },
  legendCard: { backgroundColor: '#0b2a6c', borderWidth: 1, borderColor: '#385990', padding: 14, marginBottom: 12, gap: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridChild: { minWidth: 240, flexGrow: 1, flexBasis: 250 },
  yellowBox: { backgroundColor: colors.gold, padding: 16, marginVertical: 14, alignItems: 'center' },
  bodyText: { fontFamily: fonts.body, lineHeight: 25, marginBottom: 10 },
  image: { width: '100%', height: 230, marginVertical: 12, backgroundColor: colors.pale },
  smallImage: { height: 100 },
  link: { alignSelf: 'flex-start', backgroundColor: colors.gold, paddingHorizontal: 18, paddingVertical: 12, marginVertical: 8 },
  linkText: { color: colors.navy, fontFamily: fonts.condensed, letterSpacing: 1 },
});
