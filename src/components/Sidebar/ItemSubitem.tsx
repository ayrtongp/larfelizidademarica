import React, { ReactNode } from 'react'
import SidebarLinkGroup from './SidebarLinkGroup';
import Link from 'next/link';

interface Props {
    title: string;
    suprimentosMenu: object[];
    router: any;
    pathname: string;
    sidebarExpanded: boolean;
    setSidebarExpanded: (e: boolean) => void;
    icon: ReactNode;
}

const ItemSubitem = ({ title, icon, suprimentosMenu, router, pathname, sidebarExpanded, setSidebarExpanded }: Props) => {
    return (
        <SidebarLinkGroup activecondition={suprimentosMenu.some((item: any) => pathname.includes(item.path))}>
            {(handleClick: any, open: any) => {
                return (
                    <React.Fragment>
                        <a href="#0" className={`block text-slate-200 truncate transition duration-150 ${suprimentosMenu.some((item: any) => pathname.includes(item.path)) ? 'hover:text-slate-200' : 'hover:text-white'}`}
                            onClick={(e) => { e.preventDefault(); sidebarExpanded ? handleClick() : setSidebarExpanded(true); }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {icon}
                                    <span className={`text-sm font-medium ml-3 ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>
                                        {title}
                                    </span>
                                </div>
                                {/* Icon */}
                                <div className="flex shrink-0 ml-2">
                                    <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-slate-400 ${open && 'rotate-180'}`} viewBox="0 0 12 12">
                                        <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                                    </svg>
                                </div>
                            </div>
                        </a>
                        <div className={`${sidebarExpanded ? `lg:block` : `lg:hidden`} 2xl:block`}>
                            <ul className={`pl-9 mt-1 ${!open && 'hidden'}`}>
                                {suprimentosMenu.map((item: any, index: number) => {
                                    return (
                                        <li key={index} className="mb-1 last:mb-0">
                                            <Link href={item.path} className={'block transition duration-150 truncate ' + (router.pathname === item.path ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-200')}>
                                                <span className={`text-sm font-medium ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>{item.title}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </React.Fragment>
                );
            }}
        </SidebarLinkGroup>
    )
}

export default ItemSubitem