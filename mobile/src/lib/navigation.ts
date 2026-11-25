import { Asset } from 'expo-asset';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';
import { imageSources } from '../data/imageSources';
import { localTarget } from './logic';

const documents: Record<string, number> = {
  // Metro resolves bundled document assets through static require calls.
  'codigo_etica.pdf': require('../../assets/documents/codigo_etica.pdf'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'CÓDIGO DE ÉTICA E CONDUTA ECI.docx': require('../../assets/documents/CÓDIGO DE ÉTICA E CONDUTA ECI.docx'),
};

export async function openHref(href: string, openSupport: () => void, currentSlug = 'index') {
  if (!href || href === '#') return;
  if (href.includes('apoie-modal')) { openSupport(); return; }
  if (/^(https?:|mailto:|tel:)/i.test(href)) { await Linking.openURL(href); return; }
  const [file, fragment] = href.split('#');
  const documentName = decodeURIComponent(file).split('/').pop() || '';
  if (imageSources[file]) {
    const asset = Asset.fromModule(imageSources[file] as number);
    await asset.downloadAsync();
    if (Platform.OS === 'web') await Linking.openURL(asset.uri);
    else if (asset.localUri && await Sharing.isAvailableAsync()) await Sharing.shareAsync(asset.localUri);
    return;
  }
  if (documents[documentName]) {
    const asset = Asset.fromModule(documents[documentName]);
    await asset.downloadAsync();
    if (Platform.OS === 'web') await Linking.openURL(asset.uri);
    else if (asset.localUri && await Sharing.isAvailableAsync()) await Sharing.shareAsync(asset.localUri);
    else Alert.alert('Documento indisponível', 'Não foi possível abrir este documento.');
    return;
  }
  const { slug } = localTarget(href, currentSlug);
  if (!slug || slug === 'index') {
    router.push({ pathname: '/', params: fragment ? { section: fragment } : {} });
  } else if (slug === 'login' || slug === 'admin') {
    router.push(slug === 'login' ? '/login' : '/admin');
  } else {
    router.push({ pathname: '/[slug]', params: { slug, ...(fragment ? { section: fragment } : {}) } });
  }
}
