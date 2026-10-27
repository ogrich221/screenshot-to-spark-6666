import { z } from 'zod';

const text = z.string().trim().min(1, 'Please complete this field.').max(100);
export const personalSchema = z.object({ firstName: text, middleName: z.string().trim().max(100), lastName: text, dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose your date of birth.').refine(v => { const d = new Date(v + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d < new Date() && d.getUTCFullYear() >= 1900; }, 'Enter a valid date of birth.'), citizenship: text });
export const contactSchema = z.object({ email: z.string().trim().email('Enter a valid email address.').max(255), phone: z.union([z.literal(''), z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Use an international number, such as +14155552671.')]), address: text, city: text, region: text, postal: text });
export const questionOptions = ['What was the name of your first school?', 'What city were you born in?', 'What was your childhood nickname?', 'What was the name of your first pet?', 'What is a memorable place from your childhood?'];
export const securitySchema = z.object({ questions: z.array(z.string().refine(v => questionOptions.includes(v))).length(3).refine(v => new Set(v).size === 3, 'Choose three different questions.'), answers: z.array(z.string().trim().min(3, 'Use at least 3 characters.').max(100)).length(3) });
export const pinSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/, 'Use 4–6 numbers.'), confirmPin: z.string(), biometric: z.boolean() }).refine(v => v.pin === v.confirmPin, { message: 'Your PINs don’t match.', path: ['confirmPin'] });
export const consentSchema = z.object({ terms: z.literal(true, { errorMap: () => ({ message: 'Please accept the account terms.' }) }), privacy: z.literal(true, { errorMap: () => ({ message: 'Please accept the privacy notice.' }) }), identity: z.literal(true, { errorMap: () => ({ message: 'Please provide identity-verification consent.' }) }) });
export const detailsSchema = personalSchema.merge(contactSchema);
export const applicationSchema = z.object({ details: detailsSchema, security: securitySchema, pin: pinSchema, consent: consentSchema });
export type Details = z.infer<typeof detailsSchema>;
export const blankDetails: Details = { firstName: '', middleName: '', lastName: '', dob: '', citizenship: '', email: '', phone: '', address: '', city: '', region: '', postal: '' };
export const initialBalances = { available: 0, current: 0 };
export function pinGuidance(pin: string) { return /^(\d)\1+$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin) ? 'Avoid repeated or consecutive numbers.' : pin.length === 6 ? 'Six digits give you more protection.' : 'Consider six digits for a stronger PIN.'; }