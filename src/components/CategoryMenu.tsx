import Link from 'next/link';
import { usePermissoes } from '@/hooks/usePermissao';

interface Category {
  portal_servicos: {
    nome: string;
    href: string;
  }
};

const CategoryMenu = () => {
  const [data, loading] = usePermissoes();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-wrap justify-center w-screen">
      {Array.isArray(data) && data.map((category: Category) => (
        <div key={category.portal_servicos.nome} className='m-2'>
          <Link href={category.portal_servicos.href}>
            <div className={`mx-1 p-4 rounded-lg border-2 border-black text-green-700 bg-violet-400 font-bold hover:text-white`}>
              {category.portal_servicos.nome}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default CategoryMenu;