export async function requireAdministrator(context: {
  userId: string;
  supabase: { rpc: (fn: 'has_role', args: { _user_id: string; _role: 'admin' }) => PromiseLike<{ data: unknown; error?: unknown }> };
}) {
  const { data, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (error || data !== true) throw new Error('Only the administrator can do this.');
}

export async function readAllAuthUsers<T>(readPage: (page: number, perPage: number) => Promise<{ users: T[]; error?: unknown }>): Promise<T[]> {
  const users: T[] = [];
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const result = await readPage(page, perPage);
    if (result.error) throw new Error('Could not load users. Please try again.');
    users.push(...result.users);
    if (result.users.length < perPage) return users;
  }
}