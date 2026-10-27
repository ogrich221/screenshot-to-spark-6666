CREATE TABLE public.customer_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_type text NOT NULL CHECK (card_type IN ('Physical','Virtual')),
  cardholder_name text NOT NULL,
  last4 text NOT NULL CHECK (last4 ~ '^\d{4}$'),
  expires text NOT NULL,
  credit_limit numeric NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Frozen','Cancelled')),
  issued_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.customer_cards TO authenticated;
GRANT ALL ON public.customer_cards TO service_role;
ALTER TABLE public.customer_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own cards read" ON public.customer_cards FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));