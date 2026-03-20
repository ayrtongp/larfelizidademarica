import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario';

/**
 * Async utility that checks whether a given user belongs to a specific group.
 * @param userId - The user ID obtained from the JWT token.
 * @param cod_grupo - The group code to check membership against.
 * @returns A boolean indicating whether the user is a member of the group.
 */
export async function userHasGroup(userId: string, cod_grupo: string): Promise<boolean> {
  try {
    if (!userId || !cod_grupo) return false;
    const userGroups = await GruposUsuario_getGruposUsuario(userId);
    if (!Array.isArray(userGroups)) return false;
    return userGroups.some((item) => item.cod_grupo === cod_grupo);
  } catch (error) {
    console.error('userHasGroup error:', error);
    return false;
  }
}
