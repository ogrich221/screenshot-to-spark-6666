import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { applicationSchema } from './onboarding';

const draftSchema = z.object({ details: z.object({ firstName: z.string().max(100), middleName: z.string().max(100), lastName: z.string().max(100), dob: z.string().max(10), citizenship: z.string().max(100), email: z.string().max(255), phone: z.string().max(100), address: z.string().max(100), city: z.string().max(100), region: z.string().max(100), postal: z.string().max(100), country: z.string().max(100), contactMethod: z.enum(['Email', 'Phone']) }), step: z.number().int().min(0).max(2) });
export const readCustomer = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  setResponseHeader('Cache-Control', 'no-store');
  const { data: userData, error: authError } = await context.supabase.auth.getUser();
  if (authError || !userData.user) throw new Error('Please sign in again.');
  const [profile, account] = await Promise.all([context.supabase.from('profiles').select('details,onboarding_step').eq('id', context.userId).maybeSingle(), context.supabase.from('customer_accounts').select('id,available_balance,current_balance,status,opened_at').eq('user_id', context.userId).maybeSingle()]);
  if (profile.error || account.error) throw new Error('Your account could not be loaded. Please try again.');
  return { profile: profile.data, account: account.data, email: userData.user.email ?? '', emailVerified: Boolean(userData.user.email_confirmed_at), phoneVerified: Boolean(userData.user.phone_confirmed_at) };
});
export const saveCustomerDraft = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => draftSchema.parse(v)).handler(async ({ data, context }) => {
  setResponseHeader('Cache-Control', 'no-store');
  const { error } = await context.supabase.from('profiles').upsert({ id: context.userId, details: data.details, onboarding_step: data.step, updated_at: new Date().toISOString() });
  if (error) throw new Error('We couldn’t save your progress. Please try again.');
  return { saved: true };
});
export const openCustomerAccount = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => applicationSchema.parse(v)).handler(async ({ data, context }) => {
  setResponseHeader('Cache-Control', 'no-store');
  const { data: auth, error } = await context.supabase.auth.getUser();
  if (error || !auth.user?.email_confirmed_at || auth.user.email?.toLowerCase() !== data.details.email.toLowerCase()) throw new Error('Confirm the email used to sign in before opening your account.');
  const hash = async (value: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const pepper = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    if (!pepper) throw new Error('Account security is unavailable. Please try again later.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(value + pepper), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
    const hex = (a: Uint8Array) => Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2-sha256$100000$${hex(salt)}$${hex(new Uint8Array(bits))}`;
  };
  const pinHash = await hash(data.pin.pin);
  const answerHashes = await Promise.all(data.security.answers.map(v => hash(v.trim().toLowerCase())));
  const profile = await context.supabase.from('profiles').upsert({ id: context.userId, details: data.details, onboarding_step: 5, updated_at: new Date().toISOString() });
  if (profile.error) throw new Error('Your details could not be saved. Please try again.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const result = await supabaseAdmin.rpc('finalize_customer_account', { p_user_id: context.userId, p_pin_hash: pinHash, p_question_ids: data.security.questions, p_answer_hashes: answerHashes, p_biometric: data.pin.biometric });
  if (result.error) throw new Error('We couldn’t open your account. Please try again.');
  return { id: result.data };
});