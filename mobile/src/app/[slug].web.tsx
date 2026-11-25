import { useLocalSearchParams } from 'expo-router';
import { WebReferencePage, webSlugs } from '../components/WebReferencePage';
import WebLogin from './login.web';
import WebAdmin from './admin.web';

export function generateStaticParams() { return webSlugs().map(slug => ({ slug })); }

export default function WebArticle() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const normalized = slug?.replace(/\.html$/, '') || '404';
  if (normalized === 'login') return <WebLogin />;
  if (normalized === 'admin') return <WebAdmin />;
  return <WebReferencePage slug={normalized} />;
}
