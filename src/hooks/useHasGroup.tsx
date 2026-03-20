import { useEffect, useState } from 'react';
import { getUserID } from '@/utils/Login';
import { userHasGroup } from '@/utils/functions/userHasGroup';

interface UseHasGroupResult {
  hasGroup: boolean;
  loading: boolean;
}

/**
 * React hook that checks whether the currently logged-in user belongs to a
 * specific group identified by `cod_grupo`.
 */
export function useHasGroup(cod_grupo: string): UseHasGroupResult {
  const [hasGroup, setHasGroup] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const userId = getUserID();
        if (!userId || !cod_grupo) {
          setHasGroup(false);
          return;
        }
        const result = await userHasGroup(userId, cod_grupo);
        setHasGroup(result);
      } catch (error) {
        console.error('useHasGroup error:', error);
        setHasGroup(false);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [cod_grupo]);

  return { hasGroup, loading };
}
