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
