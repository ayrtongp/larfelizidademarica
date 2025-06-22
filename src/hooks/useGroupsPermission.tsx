import GruposUsuario_getGruposUsuario from "@/actions/GruposUsuario_getGruposUsuario";
import { getUserID } from "@/utils/Login";
import { useEffect, useState } from "react";

interface Props { groups: string[]; }

export const useIsAdmin = ({ groups }: Props) => {
  const [hasGroups, setHasGroups] = useState(false);
  useEffect(() => {
    const init = async () => {
      if (groups != undefined && groups?.length > 0) {
        const userId = getUserID()
        const userGroups = await GruposUsuario_getGruposUsuario(userId);
        const groupPermissions = Array.isArray(userGroups) && userGroups.some((item) => item.id_grupo.includes(groups))
        setHasGroups(groupPermissions)
      }
    };
    init();
  }, []);
  return hasGroups;
}