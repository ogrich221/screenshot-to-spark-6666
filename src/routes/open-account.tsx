import { Localized } from '@/components/localized';
import { createFileRoute } from '@tanstack/react-router';
import { Header, Footer } from '@/components/site';
import { AccountOnboarding } from '@/components/account-onboarding';
export const Route = createFileRoute('/open-account')({ head: () => ({ meta: [{ title: 'Open your account — LUMEN BANK' }, { name: 'description', content: 'Start your LUMEN account with a clear, secure five-step application.' }, { property: 'og:title', content: 'Open your account — LUMEN BANK' }, { property: 'og:description', content: 'Personal details, secure transfers and a transparent review, one step at a time.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }), component: Page });
function Page() { return <Localized><><Header /><AccountOnboarding /><Footer /></></Localized>; }