import building from '@/assets/bank-building.jpg';
import { LoaderCircle } from 'lucide-react';

export function BankLoading() {
  return <div role="status" aria-label="LUMEN BANK" className="fixed inset-0 z-[100] grid place-items-center bg-background">
    <img src={building} alt="LUMEN BANK" className="absolute inset-0 h-full w-full object-contain" />
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-background/90 px-5 py-6 text-primary">
      <LoaderCircle aria-hidden className="size-5 animate-spin motion-reduce:animate-none" /><span className="font-display font-semibold" translate="no">LUMEN BANK</span>
    </div>
  </div>;
}