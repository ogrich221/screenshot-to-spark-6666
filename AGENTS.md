<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Admin sign-in is passcode-only via a public server function that compares against a server secret and signs in the configured admin; role checks still gate every admin action.
- Admin workspace lives under /admin (src/routes/admin*.tsx) with its own layout; it uses sample data from src/lib/admin-data.ts until a real backend is added, because no database is connected yet.
- Public pages share header/footer via Shell in src/components/site.tsx so navigation stays consistent.
- The homepage Earth loads Three.js only after hydration and rotates its surface and country markers together; respect reduced motion and dispose GPU resources on unmount.
- Live chat loads the supplied Tawk.to embed once after hydration without forwarding account, balance, or authentication data.
- Private dashboards share DashboardBackdrop and scoped dashboard-workspace surface tokens so glass styling stays consistent without changing public pages.
- Customer onboarding uses Cloud Auth and owner-scoped profiles; store only non-secret draft fields so PINs and security answers never enter browser storage.
- Customer balances change only through the admin_post_transaction SECURITY DEFINER function (admin-only, row-locked, no negative balances) which writes an account_transactions ledger entry with narration; this keeps every balance change auditable.
- Customer transfers and bill payments create pending debits via customer_request_debit; only admin_review_transaction (admin, row-locked) completes or declines them, so balances never move without approval.
- Hash onboarding secrets in authenticated server functions and keep their table unreadable to customers; account creation is idempotent.
- Languages use static reviewed catalogues and React-rendered localization boundaries; never mutate rendered DOM text or translate user-entered form values.

- Initial hydration and pending navigation share the bank-photo loading component so loading stays branded without delaying completed requests.
- International wires use the same non-submitting transfer preview with ephemeral beneficiary bank fields; no wire details are persisted or sent.
- Account and wire labels extend the shared static translation catalogue so new controls use the same localization boundary as existing pages.
- Admin-issued cards live in customer_cards (last4 + expiry only, never full credentials); utility bill payments debit the balance only through the customer_pay_bill SECURITY DEFINER function, which writes a ledger entry.
