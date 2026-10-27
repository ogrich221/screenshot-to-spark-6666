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

- Admin workspace lives under /admin (src/routes/admin*.tsx) with its own layout; it uses sample data from src/lib/admin-data.ts until a real backend is added, because no database is connected yet.
- Public pages share header/footer via Shell in src/components/site.tsx so navigation stays consistent.
- Customer onboarding uses Cloud Auth and owner-scoped profiles; store only non-secret draft fields so PINs and security answers never enter browser storage.
- Customer accounts are application records, not live financial accounts; balances remain zero until a regulated banking integration is connected.
- Customer transfer previews use a pure cent-based calculation and never submit payments, debit balances or issue payment receipts until regulated payment services exist; this prevents false financial confirmations.
- Hash onboarding secrets in authenticated server functions and keep their table unreadable to customers; account creation is idempotent.
- Languages use static reviewed catalogues and React-rendered localization boundaries; never mutate rendered DOM text or translate user-entered form values.

- Initial hydration and pending navigation share the bank-photo loading component so loading stays branded without delaying completed requests.
- International wires use the same non-submitting transfer preview with ephemeral beneficiary bank fields; no wire details are persisted or sent.
- Account and wire labels extend the shared static translation catalogue so new controls use the same localization boundary as existing pages.
