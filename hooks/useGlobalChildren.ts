import { useEffect } from 'react';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import { chatService } from '@/src/services';

export function useGlobalChildren() {
  const { isAuthenticated, user } = useAuthStore();
  const { setChildren } = useChildStore();

  useEffect(() => {
    const loadChildren = async () => {
      if (!user?.id) return;

      try {
        const userChildren = await chatService.getChildren(user.id);
        setChildren(userChildren);
      } catch (error) {
        console.error('Error loading children:', error);
      }
    };

    if (isAuthenticated && user?.id) {
      loadChildren();
    }
  }, [isAuthenticated, user?.id]);
}
