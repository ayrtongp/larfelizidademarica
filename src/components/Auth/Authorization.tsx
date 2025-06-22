import { usePermissoes } from '@/hooks/usePermissao'

interface dataItem {
  portal_servicos: {
    href: string;
  }
}

const Authorization = ({ href, children }: any) => {
  const [data, loading] = usePermissoes();
  const items: dataItem[] = data as dataItem[];

  if (loading) {
    return <p>Loading...</p>;
  }

  const hasPermission = Array.isArray(items) && items.some((item) => item.portal_servicos.href.includes(href));

  if (hasPermission) {
    return children
  } else {
    // Return nothing because is blocks authorization and should not be displayed only.
    return null
  }
};

export default Authorization;