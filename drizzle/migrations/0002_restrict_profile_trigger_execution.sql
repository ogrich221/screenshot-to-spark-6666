REVOKE ALL ON FUNCTION public.create_customer_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_profile() TO service_role;