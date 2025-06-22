import Link from "next/link"
import { FaChevronRight } from "react-icons/fa"

type Props = {
    id: string
    nome: string
    idade: number
    apelido?: string
    avatarUrl: string
}

export default function UserListMobilePhoto({ id, idade, nome, avatarUrl, apelido }: Props) {
    return (
        <Link href={`/portal/residentes/${id}`} className="col-span-12">
            <div className="flex items-center justify-between px-2 py-1 border-b border shadow-md rounded-md bg-gray-50">
                <div className="flex items-center gap-4">
                    <img
                        src={avatarUrl}
                        alt={nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-orange-300"
                    />
                    <div>
                        <p className="font-medium text-gray-800">{nome}</p>
                        <p className="text-sm text-gray-500">
                            {idade} anos
                            {apelido ? ` • ${apelido}` : ''}
                        </p>
                    </div>
                </div>
                <FaChevronRight className="text-gray-400 w-5 h-5" />
            </div>
        </Link>
    )
}