-- Migration to ensure transfers immediately debit the customer's available balance upon request,
-- with the transaction marked as pending until approved by the admin.
-- If approved: status becomes 'completed'.
-- If declined: amount is refunded back to the customer's available and current balance.
-- Also cleans up any customer record matching the admin email.

CREATE OR REPLACE FUNCTION public.customer_request_debit(p_category text, p_amount numeric, p_narration text, p_details jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  acc public.customer_accounts;
  tx_id uuid;
  new_bal numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_category NOT IN ('bill','domestic','international') THEN RAISE EXCEPTION 'Invalid category'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 5000000 OR round(p_amount,2) <> p_amount THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF length(trim(coalesce(p_narration,''))) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid narration'; END IF;
  IF pg_column_size(p_details) > 4000 THEN RAISE EXCEPTION 'Details too long'; END IF;

  SELECT * INTO acc FROM public.customer_accounts WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No opened account'; END IF;
  IF acc.available_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  -- Immediately debit the customer's available balance
  new_bal := acc.available_balance - p_amount;
  UPDATE public.customer_accounts
  SET available_balance = new_bal,
      current_balance = current_balance - p_amount
  WHERE id = acc.id;

  -- Insert pending transaction with recorded balance_after reflecting the debit
  INSERT INTO public.account_transactions (user_id, account_id, kind, amount, narration, balance_after, created_by, status, category, details)
  VALUES (auth.uid(), acc.id, 'debit', p_amount, trim(p_narration), new_bal, auth.uid(), 'pending', p_category, coalesce(p_details,'{}'::jsonb))
  RETURNING id INTO tx_id;

  RETURN tx_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.customer_request_debit(text, numeric, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.customer_request_debit(text, numeric, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_transaction(p_id uuid, p_approve boolean, p_note text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  tx public.account_transactions;
  acc public.customer_accounts;
  refund_bal numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only the administrator can do this.'; END IF;

  SELECT * INTO tx FROM public.account_transactions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR tx.status <> 'pending' THEN RAISE EXCEPTION 'This transaction is no longer pending.'; END IF;

  IF NOT p_approve THEN
    -- Admin declined: refund the debited amount back to customer's account
    SELECT * INTO acc FROM public.customer_accounts WHERE id = tx.account_id FOR UPDATE;
    IF FOUND THEN
      refund_bal := acc.available_balance + tx.amount;
      UPDATE public.customer_accounts
      SET available_balance = refund_bal,
          current_balance = current_balance + tx.amount
      WHERE id = acc.id;
    END IF;

    UPDATE public.account_transactions
    SET status = 'declined',
        reviewed_at = now(),
        review_note = left(nullif(trim(p_note),''),200)
    WHERE id = p_id;

    RETURN 'declined';
  END IF;

  -- Admin approved: mark as completed (balance was already debited when requested)
  UPDATE public.account_transactions
  SET status = 'completed',
      reviewed_at = now(),
      review_note = left(nullif(trim(p_note),''),200)
  WHERE id = p_id;

  RETURN 'completed';
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_review_transaction(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_transaction(uuid, boolean, text) TO authenticated;

-- Purge any customer account or profile associated with admin email
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE lower(email) = 'mrkeepasmile200@outlook.com' LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    DELETE FROM public.customer_security WHERE user_id = admin_uid;
    DELETE FROM public.customer_accounts WHERE user_id = admin_uid;
    DELETE FROM public.profiles WHERE id = admin_uid;
  END IF;
END $$;
