import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { logger } from '@/src/lib/logger';
import type { BabyProfile } from '../types';

interface UseChildProfileResult {
  baby: BabyProfile;
  isLoading: boolean;
}

export function useChildProfile(userId: string | undefined): UseChildProfileResult {
  const [baby, setBaby] = useState<BabyProfile>({ name: '', dob: null });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBaby = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('children')
          .select('name,birth_date')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          setBaby({ name: data.name || '', dob: data.birth_date || null });
        }
      } catch (e) {
        logger.log('Fetch baby error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBaby();
  }, [userId]);

  return { baby, isLoading };
}
