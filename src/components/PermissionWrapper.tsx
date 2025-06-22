import { usePermissoes } from '@/hooks/usePermissao'
import Link from 'next/link';
import CheckToken from './CheckToken';
import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario';
import { getUserID } from '@/utils/Login';
import { useEffect, useState } from 'react';

interface dataItem {
  portal_servicos: {
    href: string;
  }
}

interface Props {
  href: string;
  children: any;
  groups?: string[]
}

const PermissionWrapper = ({ href, children, groups }: Props) => {
  const [loadingSign, logged] = CheckToken()
  const [data, loading] = usePermissoes();
  const [hasGroups, setHasGroups] = useState<boolean>(true);

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

  if (logged) {
    const items: dataItem[] = data as dataItem[];
    if (loading) {
      return <p>Loading...</p>;
    }

    const hasPermission = Array.isArray(items) && items.some((item) => item.portal_servicos.href.includes(href)) && location.pathname.includes(href);



    if (hasPermission && hasGroups) {
      return (
        <div className='w-screen mx-auto'>
          {children}
        </div>
      )
    } else {
      return (
        <div className='mx-auto text-center w-screen h-screen flex items-center justify-center flex-col'>
          <p className='font-bold text-2xl'>
            Você não tem permissão para ver esta página
          </p>
          <div className='mt-2 border rounded-md shadow-md bg-blue-300 p-3 font-bold cursor-pointer'>
            <Link href='/portal'>Voltar</Link>
          </div>
        </div>
      );
    }
  } else {
    return (<>falha</>)
  }
};

export default PermissionWrapper;