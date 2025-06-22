import Link from 'next/link';
import { useRouter } from 'next/router'
import React from 'react'
import { FaChevronRight, FaHome } from 'react-icons/fa'

const BreadCrumb = () => {
    const { asPath } = useRouter();
    const splittedRouter = asPath.split('/').filter(Boolean);
    return (
        <div>
            <nav className="flex mb-5" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2">
                    <li className="inline-flex items-center">
                        <Link href="/portal" className="text-gray-700 hover:text-gray-900 inline-flex items-center gap-1">
                            <FaHome />
                            portal
                        </Link>
                    </li>
                    {splittedRouter.map((segment, index) => {
                        if (index > 0) {
                            return (<Item key={index} name={segment} url={`/${splittedRouter.slice(0, index + 1).join('/')}`} />)
                        }
                    })}
                </ol>
            </nav>
        </div>
    )
}

export default BreadCrumb

const Item = ({ url, name }: any) => {
    return (
        <li>
            <div className="flex items-center">
                <FaChevronRight />
                <a href={url} className="text-gray-700 hover:text-gray-900 ml-1 md:ml-2 text-sm font-medium">{name}</a>
            </div>
        </li>
    )
}