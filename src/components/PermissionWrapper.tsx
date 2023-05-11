import { usePermissoes } from '@/hooks/usePermissao'
import Link from 'next/link';
import CheckToken from './CheckToken';

interface dataItem {
  portal_servicos: {
    href: string;
  }
}

const PermissionWrapper = ({ href, children }: any) => {
  const [data, loading] = usePermissoes();
  const items: dataItem[] = data as dataItem[];

  if (loading) {
    return <p>Loading...</p>;
  }

  const hasPermission = Array.isArray(items) && items.some((item) => item.portal_servicos.href.includes(href)) && location.pathname.includes(href);

  if (hasPermission) {
    return (
      <>
        <CheckToken />
        {children}
      </>
    )
  } else {
    return (
      <div className='mx-auto text-center w-screen h-screen flex items-center justify-center flex-col'>
        <CheckToken />
        <p className='font-bold text-2xl'>
          Você não tem permissão para ver esta página
        </p>
        <div className='mt-2 border rounded-md shadow-md bg-blue-300 p-3 font-bold cursor-pointer'>
          <Link href='/portal'>Voltar</Link>
        </div>
      </div>
    );
  }
};

export default PermissionWrapper;