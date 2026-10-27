import { PasswordInput } from '@/components/ui/password-input';
import { Localized } from '@/components/localized';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Mail, LoaderCircle } from 'lucide-react';

const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
export const useCustomerAuth = () => useContext(AuthContext);
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let alive = true;
    let eventReceived = false;
    void supabase.auth.getUser().then(({ data }) => { if (alive && !eventReceived) { setUser(data.user); setLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'INITIAL_SESSION'].includes(event)) return;
      eventReceived = true;
      setUser(session?.user ?? null); setLoading(false);
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') queryClient.clear();
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function CustomerSignIn() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot'>('signup');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    const validEmail = z.string().trim().email().max(255).safeParse(email);
    if (!validEmail.success) { setError('Enter a valid email address.'); return; }
    if (mode !== 'forgot' && (password.length < (mode === 'signup' ? 12 : 1) || password.length > 128)) { setError(mode === 'signup' ? 'Use a password with 12–128 characters.' : 'Enter your password.'); return; }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const r = await supabase.auth.resetPasswordForEmail(validEmail.data, { redirectTo: window.location.origin + '/reset-password' });
        if (r.error) throw r.error;
        setMessage('If an account exists, a password-reset link is on its way.');
      } else if (mode === 'signin') {
        const r = await supabase.auth.signInWithPassword({ email: validEmail.data, password }); if (r.error) throw r.error;
      } else {
        const r = await supabase.auth.signUp({ email: validEmail.data, password, options: { emailRedirectTo: window.location.origin + '/open-account' } });
        if (r.error) throw r.error;
        if (!r.data.session) { setMessage('Check your email to confirm your address, then sign in to continue.'); setMode('signin'); }
      }
    } catch { setError('We couldn’t complete this request. Check your details and try again.'); }
    finally { setBusy(false); setPassword(''); }
  };
  const social = async (provider: 'google') => { setBusy(true); setError(''); try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + '/open-account' }); if (result.error) setError('Sign-in was not completed. Please try again.'); } catch { setError('Sign-in was not completed. Please try again.'); } finally { setBusy(false); } };
  return <Localized><div className="max-w-md space-y-6">
    <div><h2 className="text-2xl font-semibold">{mode === 'signup' ? 'A secure place to start.' : mode === 'forgot' ? 'Reset your password.' : 'Welcome back.'}</h2><p className="mt-2 text-sm text-muted-foreground">{mode === 'signup' ? 'Create your sign-in to keep your application private and return whenever you need.' : mode === 'forgot' ? 'We’ll email you a secure reset link.' : 'Sign in to finish your application or view your account.'}</p></div>
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Email address<Input className="mt-2 h-12" type="email" autoComplete="email" value={email} maxLength={255} onChange={e => setEmail(e.target.value)} required /></label>
      {mode !== 'forgot' && <label className="block text-sm font-medium">Password<PasswordInput className="mt-2 h-12" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} maxLength={128} onChange={e => setPassword(e.target.value)} required />{mode === 'signup' && <span className="mt-2 block text-xs text-muted-foreground">At least 12 characters. Your transfer PIN is separate.</span>}</label>}
      {message && <p role="status" className="text-sm text-success">{message}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy} className="h-12 w-full" type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <Mail />}{mode === 'signup' ? 'Create secure sign-in' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}<ArrowRight /></Button>
    </form>
    {mode !== 'forgot' && <><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div><div className="grid gap-3"><Button variant="outline" className="h-12" disabled={busy} onClick={() => social('google')}>Continue with Google</Button></div></>}
    <div className="flex flex-wrap gap-x-4 gap-y-1"><Button variant="link" className="h-auto px-0" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setMessage(''); }}>{mode === 'signup' ? 'Already registered? Sign in' : 'Create a sign-in'}</Button>{mode === 'signin' && <Button variant="link" className="h-auto px-0" onClick={() => setMode('forgot')}>Forgot password?</Button>}</div>
  </div></Localized>;
}