import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerAuth } from '@/components/customer-auth';
import { Localized } from '@/components/localized';

export function BackLink({ home = false }: { home?: boolean }) {
  const { user } = useCustomerAuth();
  const label = home || !user ? 'Back to home' : 'Back to my account';
  return <Localized><Button asChild variant="ghost" size="icon" title={label}><Link to={home || !user ? '/' : '/dashboard'} aria-label={label}><ArrowLeft /></Link></Button></Localized>;
}