import { describe, it, expect, vi, beforeEach } from 'vitest';

// =====================================================
// Mock supabase BEFORE importing ShopService.
// We expose a `supabaseMock` reference + helpers so each test can
// stub auth.getUser() and the chained query builder responses.
// =====================================================

type ChainResolved = { data?: unknown; error?: unknown };

const mockState: {
    currentUser: { id: string } | null;
    fromCalls: { table: string; chain: Array<{ method: string; args: unknown[] }>; resolve: ChainResolved }[];
    nextResponses: Map<string, ChainResolved[]>;
} = {
    currentUser: null,
    fromCalls: [],
    nextResponses: new Map(),
};

function makeChainable(table: string) {
    const chain: Array<{ method: string; args: unknown[] }> = [];
    const callRecord = { table, chain, resolve: { data: null, error: null } as ChainResolved };
    mockState.fromCalls.push(callRecord);

    const builder: any = {};
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'limit', 'gt', 'gte', 'lt', 'lte', 'neq', 'is'];
    methods.forEach(m => {
        builder[m] = vi.fn((...args: unknown[]) => {
            chain.push({ method: m, args });
            return builder;
        });
    });

    // Builder is a thenable: awaiting it resolves to the configured response
    // (or the test-provided next response for this table).
    builder.then = (resolve: (r: ChainResolved) => unknown) => {
        const queue = mockState.nextResponses.get(table);
        const response = queue?.shift() ?? { data: null, error: null };
        callRecord.resolve = response;
        return Promise.resolve(response).then(resolve);
    };

    return builder;
}

vi.mock('@/src/lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(async () => ({ data: { user: mockState.currentUser } })),
        },
        from: vi.fn((table: string) => makeChainable(table)),
        rpc: vi.fn(async () => ({ data: null, error: null })),
    },
}));

import { shopService } from './ShopService';

function setUser(user: { id: string } | null) {
    mockState.currentUser = user;
}

function queueResponse(table: string, response: ChainResolved) {
    const existing = mockState.nextResponses.get(table) ?? [];
    existing.push(response);
    mockState.nextResponses.set(table, existing);
}

beforeEach(() => {
    mockState.currentUser = null;
    mockState.fromCalls = [];
    mockState.nextResponses = new Map();
    vi.clearAllMocks();
});

describe('ShopService — saved products (wishlist)', () => {
    describe('saveProduct', () => {
        it('returns auth_required when no user is signed in', async () => {
            setUser(null);

            const result = await shopService.saveProduct('prod-1');

            expect(result).toEqual({ ok: false, error: 'auth_required' });
            // Should not even reach the table — auth gate trips first.
            expect(mockState.fromCalls).toHaveLength(0);
        });

        it('inserts a save row for the current user', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', { error: null });

            const result = await shopService.saveProduct('prod-1');

            expect(result).toEqual({ ok: true });
            expect(mockState.fromCalls).toHaveLength(1);
            const call = mockState.fromCalls[0];
            expect(call.table).toBe('shop_user_saved_products');
            const insertStep = call.chain.find(s => s.method === 'insert');
            expect(insertStep?.args[0]).toEqual({ user_id: 'user-1', product_id: 'prod-1' });
        });

        it('treats Postgres unique-violation 23505 as success (idempotent)', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', {
                error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            });

            const result = await shopService.saveProduct('prod-1');

            expect(result).toEqual({ ok: true });
        });

        it('treats text-matching duplicate errors as success too', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', {
                error: { code: 'XX000', message: 'row already exists in table' },
            });

            const result = await shopService.saveProduct('prod-1');

            expect(result).toEqual({ ok: true });
        });

        it('surfaces non-duplicate errors', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', {
                error: { code: 'XX000', message: 'connection lost' },
            });

            const result = await shopService.saveProduct('prod-1');

            expect(result).toEqual({ ok: false, error: 'connection lost' });
        });
    });

    describe('unsaveProduct', () => {
        it('returns auth_required when no user is signed in', async () => {
            setUser(null);

            const result = await shopService.unsaveProduct('prod-1');

            expect(result).toEqual({ ok: false, error: 'auth_required' });
            expect(mockState.fromCalls).toHaveLength(0);
        });

        it('issues delete scoped by user_id and product_id', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', { error: null });

            const result = await shopService.unsaveProduct('prod-1');

            expect(result).toEqual({ ok: true });
            const call = mockState.fromCalls[0];
            expect(call.table).toBe('shop_user_saved_products');
            const eqs = call.chain.filter(s => s.method === 'eq').map(s => s.args);
            expect(eqs).toEqual([
                ['user_id', 'user-1'],
                ['product_id', 'prod-1'],
            ]);
        });

        it('reports failure when delete errors', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', {
                error: { message: 'rls denied' },
            });

            const result = await shopService.unsaveProduct('prod-1');

            expect(result).toEqual({ ok: false, error: 'rls denied' });
        });
    });

    describe('getSavedProductIds', () => {
        it('returns [] for unauth users without hitting the DB', async () => {
            setUser(null);

            const result = await shopService.getSavedProductIds();

            expect(result).toEqual([]);
            expect(mockState.fromCalls).toHaveLength(0);
        });

        it('maps rows to bare product_id list', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', {
                data: [
                    { product_id: 'p-a' },
                    { product_id: 'p-b' },
                    { product_id: 'p-c' },
                ],
                error: null,
            });

            const result = await shopService.getSavedProductIds();

            expect(result).toEqual(['p-a', 'p-b', 'p-c']);
        });

        it('returns [] on DB error', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', {
                data: null,
                error: { message: 'boom' },
            });

            const result = await shopService.getSavedProductIds();

            expect(result).toEqual([]);
        });
    });

    describe('getSavedProducts (ordering)', () => {
        it('returns [] for unauth users', async () => {
            setUser(null);

            const result = await shopService.getSavedProducts();

            expect(result).toEqual([]);
        });

        it('returns [] when user has no saves', async () => {
            setUser({ id: 'user-1' });
            queueResponse('shop_user_saved_products', { data: [], error: null });

            const result = await shopService.getSavedProducts();

            expect(result).toEqual([]);
            // Only the saves lookup ran; never tried to hydrate products.
            expect(mockState.fromCalls).toHaveLength(1);
            expect(mockState.fromCalls[0].table).toBe('shop_user_saved_products');
        });

        it('preserves saved_at DESC order even when product hydration returns rows out of order', async () => {
            setUser({ id: 'user-1' });

            // Saves come back newest-first (saved_at DESC):
            queueResponse('shop_user_saved_products', {
                data: [
                    { product_id: 'p-newest', saved_at: '2026-04-28T10:00:00Z' },
                    { product_id: 'p-mid', saved_at: '2026-04-20T10:00:00Z' },
                    { product_id: 'p-oldest', saved_at: '2026-04-01T10:00:00Z' },
                ],
                error: null,
            });

            // But products come back in arbitrary order from the join:
            queueResponse('shop_products', {
                data: [
                    { id: 'p-mid', name: 'Mid', primary_affiliate: [{ affiliate: { name: 'A', logo_url: '' } }] },
                    { id: 'p-oldest', name: 'Oldest', primary_affiliate: [{ affiliate: { name: 'A', logo_url: '' } }] },
                    { id: 'p-newest', name: 'Newest', primary_affiliate: [{ affiliate: { name: 'A', logo_url: '' } }] },
                ],
                error: null,
            });

            const result = await shopService.getSavedProducts();

            expect(result.map(p => p.id)).toEqual(['p-newest', 'p-mid', 'p-oldest']);
        });

        it('surfaces empty array when product hydration errors', async () => {
            setUser({ id: 'user-1' });

            queueResponse('shop_user_saved_products', {
                data: [{ product_id: 'p-1', saved_at: '2026-04-28T10:00:00Z' }],
                error: null,
            });
            queueResponse('shop_products', {
                data: null,
                error: { message: 'hydrate failed' },
            });

            const result = await shopService.getSavedProducts();

            expect(result).toEqual([]);
        });
    });

    describe('save+unsave roundtrip', () => {
        it('save then unsave each issue exactly one DB call to the saves table', async () => {
            setUser({ id: 'user-1' });

            queueResponse('shop_user_saved_products', { error: null });
            const saveResult = await shopService.saveProduct('prod-x');
            expect(saveResult.ok).toBe(true);

            queueResponse('shop_user_saved_products', { error: null });
            const unsaveResult = await shopService.unsaveProduct('prod-x');
            expect(unsaveResult.ok).toBe(true);

            expect(mockState.fromCalls).toHaveLength(2);
            expect(mockState.fromCalls[0].chain.some(s => s.method === 'insert')).toBe(true);
            expect(mockState.fromCalls[1].chain.some(s => s.method === 'delete')).toBe(true);
        });
    });
});
