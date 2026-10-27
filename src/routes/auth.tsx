import { Localized } from '@/components/localized';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Header } from '@/components/site';
import { CustomerSignIn, useCustomerAuth } from '@/components/customer-auth';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/auth')({ head: () => ({ meta: [{ title: 'Customer sign-in — LUMEN BANK' }, { name: 'description', content: 'Securely sign in to your LUMEN application account.' }, { property: 'og:title', content: 'Customer sign-in — LUMEN BANK' }, { property: 'og:description', content: 'Return to your saved application and customer account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Page });
function Page() { const { user, loading } = useCustomerAuth(); return <Localized><><Header /><main className="mx-auto max-w-md px-5 py-16">{loading ? <p>Loading…</p> : user ? <><h1 className="text-3xl font-semibold">You’re signed in.</h1><Button asChild className="mt-6"><Link to="/dashboard">Continue</Link></Button></> : <CustomerSignIn />}</main></></Localized>; }