CREATE OR REPLACE FUNCTION public.customer_pay_bill(p_type text, p_provider text, p_reference text, p_amount numeric)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acc public.customer_accounts; new_bal numeric; tx_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_type NOT IN ('Electricity','Water','Gas','Internet & phone') THEN RAISE EXCEPTION 'Invalid bill type'; END IF;
  IF length(trim(coalesce(p_provider,''))) NOT BETWEEN 1 AND 120 OR length(trim(coalesce(p_reference,''))) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid bill details'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 5000000 OR round(p_amount,2) <> p_amount THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT * INTO acc FROM public.customer_accounts WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No opened account'; END IF;
  new_bal := acc.available_balance - p_amount;
  IF new_bal < 0 THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  UPDATE public.customer_accounts SET available_balance = new_bal, current_balance = current_balance - p_amount WHERE id = acc.id;
  INSERT INTO public.account_transactions (user_id, account_id, kind, amount, narration, balance_after, created_by)
  VALUES (auth.uid(), acc.id, 'debit', p_amount, left(p_type || ' bill — ' || trim(p_provider) || ' (ref ' || trim(p_reference) || ')', 200), new_bal, auth.uid())
  RETURNING id INTO tx_id;
  RETURN json_build_object('id', tx_id, 'balance', new_bal);
END $$;
REVOKE EXECUTE ON FUNCTION public.customer_pay_bill(text, text, text, numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.customer_pay_bill(text, text, text, numeric) TO authenticated;