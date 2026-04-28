import { useChildStore } from '../../src/shared/stores/childStore';
import type { Child } from '../../src/lib/database.types';

const buildChild = (overrides: Partial<Child> & { id: string; name: string }): Child => ({
  parent_id: 'parent-1',
  birth_date: '2025-01-15',
  gender: 'female',
  created_at: '2025-01-15T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
  ...overrides,
});

const A = buildChild({ id: 'a', name: 'Alice' });
const B = buildChild({ id: 'b', name: 'Bob' });
const C = buildChild({ id: 'c', name: 'Charlie' });

const resetStore = () => {
  useChildStore.setState({
    children: [],
    activeChild: null,
    activeChildId: null,
    isLoading: false,
    error: null,
  });
};

describe('useChildStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('setChildren', () => {
    it('clears active when called with an empty array', () => {
      useChildStore.setState({ activeChild: A, activeChildId: A.id, children: [A] });
      useChildStore.getState().setChildren([]);

      const state = useChildStore.getState();
      expect(state.children).toEqual([]);
      expect(state.activeChild).toBeNull();
      expect(state.activeChildId).toBeNull();
    });

    it('defaults active to the first child when no activeChildId is set', () => {
      useChildStore.getState().setChildren([A, B]);

      const state = useChildStore.getState();
      expect(state.activeChild?.id).toBe('a');
      expect(state.activeChildId).toBe('a');
    });

    it('preserves the existing activeChildId when that child is still in the new list', () => {
      useChildStore.setState({ activeChildId: 'b' });
      useChildStore.getState().setChildren([A, B]);

      expect(useChildStore.getState().activeChild?.id).toBe('b');
      expect(useChildStore.getState().activeChildId).toBe('b');
    });

    it('falls back to the first child when activeChildId is no longer present', () => {
      useChildStore.setState({ activeChildId: 'missing' });
      useChildStore.getState().setChildren([A, B]);

      expect(useChildStore.getState().activeChild?.id).toBe('a');
      expect(useChildStore.getState().activeChildId).toBe('a');
    });
  });

  describe('setActiveChild', () => {
    it('switches active when the id exists in children', () => {
      useChildStore.getState().setChildren([A, B]);
      useChildStore.getState().setActiveChild('b');

      expect(useChildStore.getState().activeChild?.id).toBe('b');
      expect(useChildStore.getState().activeChildId).toBe('b');
    });

    it('is a no-op when the id is not in children', () => {
      useChildStore.getState().setChildren([A, B]);
      useChildStore.getState().setActiveChild('nonexistent');

      expect(useChildStore.getState().activeChild?.id).toBe('a');
      expect(useChildStore.getState().activeChildId).toBe('a');
    });
  });

  describe('addChild', () => {
    it('makes the first added child active automatically', () => {
      useChildStore.getState().addChild(A);

      const state = useChildStore.getState();
      expect(state.children).toEqual([A]);
      expect(state.activeChild?.id).toBe('a');
      expect(state.activeChildId).toBe('a');
    });

    it('does not change active when adding a subsequent child', () => {
      useChildStore.getState().addChild(A);
      useChildStore.getState().addChild(B);

      const state = useChildStore.getState();
      expect(state.children.map((c) => c.id)).toEqual(['a', 'b']);
      expect(state.activeChildId).toBe('a');
    });
  });

  describe('removeChild', () => {
    it('reassigns active to the next child when active is removed', () => {
      useChildStore.getState().setChildren([A, B, C]);
      useChildStore.getState().removeChild('a');

      const state = useChildStore.getState();
      expect(state.children.map((c) => c.id)).toEqual(['b', 'c']);
      expect(state.activeChildId).toBe('b');
    });

    it('clears active when the last child is removed', () => {
      useChildStore.getState().setChildren([A]);
      useChildStore.getState().removeChild('a');

      const state = useChildStore.getState();
      expect(state.children).toEqual([]);
      expect(state.activeChild).toBeNull();
      expect(state.activeChildId).toBeNull();
    });

    it('leaves active untouched when a non-active child is removed', () => {
      useChildStore.getState().setChildren([A, B]);
      useChildStore.getState().removeChild('b');

      const state = useChildStore.getState();
      expect(state.children.map((c) => c.id)).toEqual(['a']);
      expect(state.activeChildId).toBe('a');
    });
  });

  describe('updateChild', () => {
    it('reflects updates on activeChild when the active child is the one being updated', () => {
      useChildStore.getState().setChildren([A, B]);
      useChildStore.getState().updateChild('a', { name: 'Updated' });

      const state = useChildStore.getState();
      expect(state.activeChild?.name).toBe('Updated');
      expect(state.children.find((c) => c.id === 'a')?.name).toBe('Updated');
    });

    it('does not mutate activeChild when a non-active child is updated', () => {
      useChildStore.getState().setChildren([A, B]);
      useChildStore.getState().updateChild('b', { name: 'Other' });

      const state = useChildStore.getState();
      expect(state.activeChild?.name).toBe('Alice');
      expect(state.children.find((c) => c.id === 'b')?.name).toBe('Other');
    });
  });
});
