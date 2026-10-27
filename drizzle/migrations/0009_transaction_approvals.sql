ALTER TABLE public.account_transactions ADD COLUMN status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','declined'));
ALTER TABLE public.account_transactions ADD COLUMN category text NOT NULL DEFAULT 'adjustment';
ALTER TABLE public.account_transactions ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.account_transactions ADD COLUMN reviewed_at timestamptz;
ALTER TABLE public.account_transactions ADD COLUMN review_note text;
ALTER TABLE public.account_transactions ALTER COLUMN balance_after DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.customer_request_debit(p_category text, p_amount numeric, p_narration text, p_details jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acc public.customer_accounts; tx_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_category NOT IN ('bill','domestic','international') THEN RAISE EXCEPTION 'Invalid category'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 5000000 OR round(p_amount,2) <> p_amount THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF length(trim(coalesce(p_narration,''))) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid narration'; END IF;
  IF pg_column_size(p_details) > 4000 THEN RAISE EXCEPTION 'Details too long'; END IF;
  SELECT * INTO acc FROM public.customer_accounts WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'No opened account'; END IF;
  IF acc.available_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  INSERT INTO public.account_transactions (user_id, account_id, kind, amount, narration, balance_after, created_by, status, category, details)
  VALUES (auth.uid(), acc.id, 'debit', p_amount, trim(p_narration), NULL, auth.uid(), 'pending', p_category, coalesce(p_details,'{}'::jsonb))
  RETURNING id INTO tx_id;
  RETURN tx_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.customer_request_debit(text, numeric, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.customer_request_debit(text, numeric, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_transaction(p_id uuid, p_approve boolean, p_note text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tx public.account_transactions; acc public.customer_accounts; new_bal numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only the administrator can do this.'; END IF;
  SELECT * INTO tx FROM public.account_transactions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR tx.status <> 'pending' THEN RAISE EXCEPTION 'This transaction is no longer pending.'; END IF;
  IF NOT p_approve THEN
    UPDATE public.account_transactions SET status = 'declined', reviewed_at = now(), review_note = left(nullif(trim(p_note),''),200) WHERE id = p_id;
    RETURN 'declined';
  END IF;
  SELECT * INTO acc FROM public.customer_accounts WHERE id = tx.account_id FOR UPDATE;
  new_bal := acc.available_balance - tx.amount;
  IF new_bal < 0 THEN RAISE EXCEPTION 'Insufficient balance to approve.'; END IF;
  UPDATE public.customer_accounts SET available_balance = new_bal, current_balance = current_balance - tx.amount WHERE id = acc.id;
  UPDATE public.account_transactions SET status = 'completed', balance_after = new_bal, reviewed_at = now(), review_note = left(nullif(trim(p_note),''),200) WHERE id = p_id;
  RETURN 'completed';
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_review_transaction(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_transaction(uuid, boolean, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.customer_pay_bill(text, text, text, numeric) FROM authenticated;
COMMENT ON FUNCTION public.customer_pay_bill(text, text, text, numeric) IS 'DEPRECATED: replaced by customer_request_debit + admin approval';