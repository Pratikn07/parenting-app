import { create } from 'zustand';
import { logger } from '@/src/lib/logger';
import { shopService } from '@/src/services/shop/ShopService';
import { useAuthStore } from './authStore';

/**
 * Global store of the user's saved-product IDs.
 *
 * Why a store and not per-card queries: ShopHome / SearchResults / Saved
 * screens render up to 30 ProductCards at a time. A per-card isProductSaved
 * query would mean 30 round trips. One hydrate() = one round trip = the
 * Set<string> backing every card's filled-vs-outline render.
 *
 * Lifecycle:
 *   - Auto-hydrates on auth login (subscribed to authStore at module load).
 *   - Auto-clears on auth logout (same subscription).
 *   - On cold start with a persisted auth session, hydrates once on first import.
 *
 * Toggle is optimistic: heart fills/empties immediately; DB write happens
 * in the background; on error we revert. This is the right UX for a tap
 * affordance — users should never wait for a network round trip to feel
 * acknowledged.
 *
 * NOT persisted to AsyncStorage: source of truth is the DB. Restarting the
 * app re-hydrates from DB rather than risk drift.
 */

interface ToggleResult {
    ok: boolean;
    saved: boolean;
    error?: string;
}

interface SavedProductsState {
    ids: Set<string>;
    isHydrated: boolean;
    isHydrating: boolean;

    hydrate: () => Promise<void>;
    toggle: (productId: string) => Promise<ToggleResult>;
    clear: () => void;
    isSaved: (productId: string) => boolean;
}

export const useSavedProductsStore = create<SavedProductsState>((set, get) => ({
    ids: new Set<string>(),
    isHydrated: false,
    isHydrating: false,

    hydrate: async () => {
        if (get().isHydrating) return;
        set({ isHydrating: true });

        try {
            const ids = await shopService.getSavedProductIds();
            set({
                ids: new Set(ids),
                isHydrated: true,
                isHydrating: false,
            });
        } catch (error) {
            logger.log('Saved products hydrate error:', error);
            set({ isHydrating: false });
        }
    },

    toggle: async (productId) => {
        const currentIds = get().ids;
        const wasSaved = currentIds.has(productId);

        const nextIds = new Set(currentIds);
        if (wasSaved) {
            nextIds.delete(productId);
        } else {
            nextIds.add(productId);
        }
        set({ ids: nextIds });

        const result = wasSaved
            ? await shopService.unsaveProduct(productId)
            : await shopService.saveProduct(productId);

        if (!result.ok) {
            set({ ids: currentIds });
            logger.log('Saved products toggle failed, reverted:', { productId, error: result.error });
            return { ok: false, saved: wasSaved, error: result.error };
        }

        return { ok: true, saved: !wasSaved };
    },

    clear: () => {
        set({
            ids: new Set<string>(),
            isHydrated: false,
            isHydrating: false,
        });
    },

    isSaved: (productId) => get().ids.has(productId),
}));

// =====================================================
// Auth lifecycle subscription (module-level side effect)
// Fires on every authStore change. Hydrates on login transitions,
// clears on logout transitions. Tracks last-seen value to dedupe
// no-op authStore writes.
// =====================================================

let lastAuth: boolean | null = null;

useAuthStore.subscribe((state) => {
    const currentAuth = state.isAuthenticated;
    if (lastAuth === currentAuth) return;
    lastAuth = currentAuth;

    if (currentAuth) {
        useSavedProductsStore.getState().hydrate();
    } else {
        useSavedProductsStore.getState().clear();
    }
});

// Bootstrap: if auth is already restored from AsyncStorage at module load,
// fire an initial hydrate. Otherwise the subscriber above will handle it
// when checkAuthState() flips isAuthenticated to true.
if (useAuthStore.getState().isAuthenticated) {
    lastAuth = true;
    useSavedProductsStore.getState().hydrate();
}
