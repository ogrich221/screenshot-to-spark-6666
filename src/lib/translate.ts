import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import type { Locale } from './locale';
import { accountLabels } from './account-labels';
export const catalogues: Record<Exclude<Locale, 'en'>, Record<string, string>> = { fr: { ...fr, ...accountLabels.fr }, es: { ...es, ...accountLabels.es }, de: { ...de, ...accountLabels.de }, pt: { ...pt, ...accountLabels.pt } };
export function translate(text: string, lang: Locale): string {
  if (lang === 'en' || !text.trim()) return text;
  const dictionary = catalogues[lang];
  const normalized = text.replace(/\s+/g, ' ').trim();
  const exact = dictionary[normalized];
  if (exact) return text.replace(text.trim(), exact);
  // Dynamic messages retain names and values while translating known fragments.
  const parts = normalized.split(/(\s*·\s*|\s*:\s*|\s*—\s*)/);
  if (parts.length > 1) return parts.map(p => dictionary[p.trim()] ?? p).join('');
  for (const [prefix, ending] of [['Welcome', '.'], ['Welcome back', '.'], ['Step', ''], ['Showing', '']] as const) {
    if (normalized.startsWith(prefix + ' ') || normalized.startsWith(prefix + ',')) return normalized.replace(prefix, dictionary[prefix] ?? prefix);
  }
  return text;
}