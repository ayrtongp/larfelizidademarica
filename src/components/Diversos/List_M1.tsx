import React from 'react'
import { FaPen } from 'react-icons/fa';

interface Props {
    itemsList: Item[];
    className?: string;
}

interface Item {
    title: string;
    description: string;
    status?: string;
    statusValue?: string;
    editButton?: boolean
}

const List_M1 = ({ itemsList, className }: Props) => {
    return (
        <ul className={`bg-white shadow overflow-hidden sm:rounded-md max-w-sm mx-auto mt-16 ${className}`}>
            {itemsList.length > 0 && itemsList.map((item: Item, index: number) => {

                return (
                    <li key={index} className={`${index > 0 ? 'border-t' : ''}`}>
                        <div className="px-4 py-5 sm:px-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">{item.title}</h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">{item.description}</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">{item.status}:  <span className="text-green-600">{item.statusValue}</span></p>
                                {item.editButton && (<a href="#" className="font-medium text-indigo-600 hover:text-indigo-500"><FaPen /></a>)}
                            </div>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}

export default List_M1