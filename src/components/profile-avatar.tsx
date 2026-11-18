import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Owner-only profile photo stored in the private avatars bucket. */
export function useAvatar() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.storage.from('avatars').createSignedUrl(`${u.user.id}/avatar`, 3600);
    setUrl(data?.signedUrl ? `${data.signedUrl}&v=${Date.now()}` : null);
  };
  useEffect(() => { void load(); }, []);
  const upload = async (file: File) => {
    setError('');
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setError('Choose an image under 5 MB.'); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const r = await supabase.storage.from('avatars').upload(`${u.user.id}/avatar`, file, { upsert: true, contentType: file.type });
      if (r.error) setError('Photo could not be saved. Try again.'); else await load();
    }
    setBusy(false);
  };
  return { url, busy, error, upload };
}

export function AvatarImage({ url, initials, className }: { url: string | null; initials: string; className?: string }) {
  return <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full bg-gold font-display font-bold text-primary-foreground ring-2 ring-primary/40', className)}>
    {url ? <img src={url} alt="Profile photo" className="size-full object-cover" /> : initials}
  </span>;
}

export function AvatarEditor({ avatar, initials, compact = false }: { avatar: ReturnType<typeof useAvatar>; initials: string; compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return <div className={cn('flex shrink-0 gap-4', compact ? 'flex-col items-start gap-2' : 'items-center')}>
    <div className="relative">
      <AvatarImage url={avatar.url} initials={initials} className={compact ? 'size-16 text-xl' : 'size-20 text-2xl'} />
      <Button variant="outline" size="icon" type="button" disabled={avatar.busy} onClick={() => ref.current?.click()} aria-label="Change profile photo" title="Change profile photo" className="absolute -bottom-1 -right-1 size-8 rounded-full bg-background text-primary">
        {avatar.busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
      </Button>
    </div>
    <div>
      <Button variant="link" type="button" disabled={avatar.busy} onClick={() => ref.current?.click()} className="h-auto p-0 text-sm font-semibold">{avatar.url ? 'Change photo' : 'Add photo'}</Button>
      {!compact && <p className="text-xs text-muted-foreground">JPG or PNG, up to 5 MB</p>}
      {avatar.error && <p role="alert" className="text-xs text-destructive">{avatar.error}</p>}
    </div>
    <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void avatar.upload(f); e.target.value = ''; }} />
  </div>;
}
