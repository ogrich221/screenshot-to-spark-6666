CREATE TABLE public.account_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.customer_accounts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('credit','debit')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  narration text NOT NULL CHECK (length(narration) BETWEEN 1 AND 200),
  balance_after numeric(14,2) NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_transactions TO authenticated;
GRANT ALL ON public.account_transactions TO service_role;
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin transactions read" ON public.account_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin accounts read" ON public.customer_accounts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_post_transaction(p_user_id uuid, p_kind text, p_amount numeric, p_narration text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acc public.customer_accounts; new_bal numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only the administrator can do this.'; END IF;
  IF p_kind NOT IN ('credit','debit') THEN RAISE EXCEPTION 'Invalid type'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR round(p_amount,2) <> p_amount THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF length(trim(coalesce(p_narration,''))) = 0 THEN RAISE EXCEPTION 'Narration required'; END IF;
  SELECT * INTO acc FROM public.customer_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This user has no opened account.'; END IF;
  new_bal := acc.available_balance + CASE WHEN p_kind = 'credit' THEN p_amount ELSE -p_amount END;
  IF new_bal < 0 THEN RAISE EXCEPTION 'Insufficient balance for this debit.'; END IF;
  UPDATE public.customer_accounts SET available_balance = new_bal, current_balance = current_balance + CASE WHEN p_kind = 'credit' THEN p_amount ELSE -p_amount END WHERE id = acc.id;
  INSERT INTO public.account_transactions (user_id, account_id, kind, amount, narration, balance_after, created_by)
  VALUES (p_user_id, acc.id, p_kind, p_amount, trim(p_narration), new_bal, auth.uid());
  RETURN new_bal;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_post_transaction(uuid, text, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_post_transaction(uuid, text, numeric, text) TO authenticated;