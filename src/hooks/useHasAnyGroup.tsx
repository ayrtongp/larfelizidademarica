import { useEffect, useState } from 'react';
import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario';
import { getUserID } from '@/utils/Login';

interface GrupoUsuario {
  id_grupo?: string;
  cod_grupo?: string;
}

interface UseHasAnyGroupResult {
  hasGroup: boolean;
  loading: boolean;
}

export function useHasAnyGroup(groupIdentifiers: string[]): UseHasAnyGroupResult {
  const [hasGroup, setHasGroup] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setLoading(true);

        const normalized = groupIdentifiers.map((item) => item.trim()).filter(Boolean);
        if (normalized.length === 0) {
          if (active) setHasGroup(true);
          return;
        }

        const userId = getUserID();
        if (!userId) {
          if (active) setHasGroup(false);
          return;
        }

        const userGroups = await GruposUsuario_getGruposUsuario(userId);
        const allowed = new Set(normalized);
        const match = Array.isArray(userGroups) && userGroups.some((item: GrupoUsuario) =>
          (item.id_grupo && allowed.has(item.id_grupo)) ||
          (item.cod_grupo && allowed.has(item.cod_grupo))
        );

        if (active) setHasGroup(match);
      } catch (error) {
        console.error('useHasAnyGroup error:', error);
        if (active) setHasGroup(false);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [groupIdentifiers.join('|')]);

  return { hasGroup, loading };
}
