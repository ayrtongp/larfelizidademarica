import Link from 'next/link';

interface CategoryMenu {
  name: string;
  href: string;
}

interface Props {
  categories: CategoryMenu[];
}

const CategoryButton: React.FC<CategoryMenu> = ({ name, href }) => (
  <Link href={href}>
    <div className={`mx-1 p-4 rounded-lg border-2 border-black text-green-700 bg-violet-400 font-bold hover:text-white`}>
      {name}
    </div>
  </Link>
);

const CategoryMenu: React.FC<Props> = ({ categories }) => (
  <div className="flex justify-between">
    {categories.map((category) => (
      <CategoryButton key={category.name} {...category} />
    ))}
  </div>
);

export default CategoryMenu;