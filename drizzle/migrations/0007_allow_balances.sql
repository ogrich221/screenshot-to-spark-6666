ALTER TABLE public.customer_accounts DROP CONSTRAINT customer_accounts_available_balance_check;
ALTER TABLE public.customer_accounts DROP CONSTRAINT customer_accounts_current_balance_check;
ALTER TABLE public.customer_accounts ADD CONSTRAINT customer_accounts_available_balance_check CHECK (available_balance >= 0);
ALTER TABLE public.customer_accounts ADD CONSTRAINT customer_accounts_current_balance_check CHECK (current_balance >= 0);