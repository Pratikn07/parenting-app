import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Child } from '@/src/lib/database.types';

interface ChildState {
    children: Child[];
    activeChild: Child | null;
    activeChildId: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setChildren: (children: Child[]) => void;
    setActiveChild: (childId: string) => void;
    addChild: (child: Child) => void;
    updateChild: (childId: string, updates: Partial<Child>) => void;
    removeChild: (childId: string) => void;
}

export const useChildStore = create<ChildState>()(
    persist(
        (set, get) => ({
            children: [],
            activeChild: null,
            activeChildId: null,
            isLoading: false,
            error: null,

            setChildren: (children) => {
                const { activeChildId } = get();
                // If there's an active child ID, try to find it in the new list
                // Otherwise default to the first child
                let newActiveChild = null;
                if (children.length > 0) {
                    if (activeChildId) {
                        newActiveChild = children.find(c => c.id === activeChildId) || children[0];
                    } else {
                        newActiveChild = children[0];
                    }
                }

                set({
                    children,
                    activeChild: newActiveChild,
                    activeChildId: newActiveChild?.id || null,
                });
            },

            setActiveChild: (childId) => {
                const { children } = get();
                const child = children.find((c) => c.id === childId);
                if (child) {
                    set({ activeChild: child, activeChildId: childId });
                }
            },

            addChild: (child) => {
                set((state) => {
                    const newChildren = [...state.children, child];
                    // If this is the first child, make it active
                    if (newChildren.length === 1) {
                        return {
                            children: newChildren,
                            activeChild: child,
                            activeChildId: child.id,
                        };
                    }
                    return { children: newChildren };
                });
            },

            updateChild: (childId, updates) => {
                set((state) => {
                    const newChildren = state.children.map((c) =>
                        c.id === childId ? { ...c, ...updates } : c
                    );

                    // Update active child if it's the one being modified
                    const newActiveChild = state.activeChildId === childId
                        ? { ...state.activeChild!, ...updates }
                        : state.activeChild;

                    return {
                        children: newChildren,
                        activeChild: newActiveChild,
                    };
                });
            },

            removeChild: (childId) => {
                set((state) => {
                    const newChildren = state.children.filter((c) => c.id !== childId);

                    // If we removed the active child, switch to another one or null
                    let newActiveChild = state.activeChild;
                    let newActiveChildId = state.activeChildId;

                    if (state.activeChildId === childId) {
                        newActiveChild = newChildren.length > 0 ? newChildren[0] : null;
                        newActiveChildId = newActiveChild?.id || null;
                    }

                    return {
                        children: newChildren,
                        activeChild: newActiveChild,
                        activeChildId: newActiveChildId,
                    };
                });
            },
        }),
        {
            name: 'child-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                children: state.children,
                activeChildId: state.activeChildId,
            }),
            onRehydrateStorage: () => (state) => {
                // After hydration, reconstruct activeChild from children array
                if (state && state.activeChildId && state.children.length > 0) {
                    const activeChild = state.children.find(c => c.id === state.activeChildId) || state.children[0];
                    state.activeChild = activeChild;
                }
            },
        }
    )
);
