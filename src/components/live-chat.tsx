import { useEffect } from 'react';

const scriptId = 'lumen-tawk-chat';
const embedUrl = 'https://embed.tawk.to/6ae3eb3ae7b7b634715b9dcd/1k654tnse';

export function LiveChat() {
  useEffect(() => {
    if (document.getElementById(scriptId)) return;
    const host = window as typeof window & {
      Tawk_API?: Record<string, unknown>;
      Tawk_LoadStart?: Date;
    };
    host.Tawk_API = host.Tawk_API ?? {};
    host.Tawk_LoadStart = new Date();
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = embedUrl;
    script.charset = 'UTF-8';
    document.head.appendChild(script);
  }, []);
  return null;
}