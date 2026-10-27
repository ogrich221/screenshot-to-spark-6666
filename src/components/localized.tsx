import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { useLocale } from '@/lib/locale';
import { translate } from '@/lib/translate';
import type { Locale } from '@/lib/locale';

const textAttributes = ['title', 'placeholder', 'aria-label', 'alt', 'label', 'sub', 'eyebrow', 'help', 'text', 'description', 'crumb'] as const;
function localizeNode(node: ReactNode, lang: Locale): ReactNode {
  if (typeof node === 'string') return translate(node, lang);
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  const props = element.props;
  if (props['translate'] === 'no' || props['data-no-translate']) return node;
  const next: Record<string, unknown> = {};
  if (element.type === 'option' && props['value'] === undefined && typeof props['children'] === 'string') next['value'] = props['children'];
  for (const key of textAttributes) if (typeof props[key] === 'string') next[key] = translate(props[key], lang);
  // Values, event handlers, keys and customer-entered information remain untouched.
  if (props['children'] !== undefined) {
    const children = props['children'] as ReactNode;
    next['children'] = Array.isArray(children) ? Children.map(children, child => localizeNode(child, lang)) : localizeNode(children, lang);
  }
  return cloneElement(element, next);
}
export function Localized({ children }: { children: ReactNode }) { const { lang } = useLocale(); return <>{Children.map(children, child => localizeNode(child, lang))}</>; }