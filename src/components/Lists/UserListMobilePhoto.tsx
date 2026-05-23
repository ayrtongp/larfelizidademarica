import Link from "next/link"
import React, { useState } from "react"
import { FaChevronRight } from "react-icons/fa"

type Props = {
    id: string
    nome: string
    idade: number
    apelido?: string
    avatarUrl?: string
}

function normalizePhoto(src?: string): string | undefined {
    if (!src) return undefined;
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    return `data:image/jpeg;base64,${src}`;
}

export default function UserListMobilePhoto({ id, idade, nome, avatarUrl, apelido }: Props) {
    const [erro, setErro] = useState(false);
    const src = normalizePhoto(avatarUrl);

    return (
        <Link href={`/portal/residentes/${id}`} className="col-span-12">
            <div className="flex items-center justify-between px-2 py-1 border-b border shadow-md rounded-md bg-gray-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-300 bg-gray-200 flex-shrink-0 flex items-center justify-center">
                        {src && !erro ? (
                            <img
                                src={src}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={() => setErro(true)}
                            />
                        ) : (
                            <span className="text-gray-500 text-sm font-bold">
                                {nome.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
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
