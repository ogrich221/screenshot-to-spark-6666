import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'fr' | 'es' | 'de' | 'pt';
const LocaleContext = createContext<{ lang: Locale; setLang: (lang: Locale) => void }>({ lang: 'en', setLang: () => {} });
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLanguage] = useState<Locale>('en');
  useEffect(() => { const saved = window.localStorage.getItem('lumen-language'); if (saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'de' || saved === 'pt') setLanguage(saved); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (value: Locale) => { setLanguage(value); window.localStorage.setItem('lumen-language', value); };
  return <LocaleContext.Provider value={{ lang, setLang }}>{children}</LocaleContext.Provider>;
}
export const useLocale = () => useContext(LocaleContext);