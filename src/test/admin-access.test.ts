import { describe, expect, it, vi } from 'vitest';
import { readAllAuthUsers, requireAdministrator } from '@/lib/admin-access';

describe('Admin customer visibility', () => {
  it('includes newly registered users even beyond the first page', async () => {
    const existing = Array.from({ length: 1000 }, (_, id) => ({ id }));
    const read = vi.fn(async (page: number) => ({ users: page === 1 ? existing : [{ id: 1000 }] }));
    const users = await readAllAuthUsers(read);
    expect(users).toHaveLength(1001);
    expect(users.at(-1)).toEqual({ id: 1000 });
  });
  it('reports a failed live read instead of returning sample customers', async () => {
    await expect(readAllAuthUsers(async () => ({ users: [], error: new Error('offline') }))).rejects.toThrow('Could not load users');
  });
  it('allows only a server-validated administrator', async () => {
    await expect(requireAdministrator({ userId: 'admin', supabase: { rpc: async () => ({ data: true }) } })).resolves.toBeUndefined();
    await expect(requireAdministrator({ userId: 'customer', supabase: { rpc: async () => ({ data: false }) } })).rejects.toThrow('Only the administrator');
  });
  it('denies access when the role lookup fails', async () => {
    await expect(requireAdministrator({ userId: 'customer', supabase: { rpc: async () => ({ data: true, error: new Error('offline') }) } })).rejects.toThrow('Only the administrator');
  });
});