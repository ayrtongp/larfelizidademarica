import React, { ReactNode } from 'react'
import Link from 'next/link';

interface Props {
    label: string;
    name: string;
    pathname: string;
    sidebarExpanded: boolean;
    icon: ReactNode;
}

const Item = ({ pathname, name, sidebarExpanded, label, icon }: Props) => {
    return (
        <div className=''>
            {/* Residentes */}
            <li className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${pathname.includes(name) && 'bg-slate-900'}`}>
                <Link href="/portal/residentes" className={`block text-slate-200 truncate transition duration-150 ${pathname.includes(name) ? 'hover:text-slate-200' : 'hover:text-white'}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="grow flex items-center">
                            {icon}
                            <span className={`text-sm font-medium ml-3 ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>
                                {label}
                            </span>
                        </div>
                    </div>
                </Link>
            </li>
        </div>
    )
}

export default Item