import React, { ReactNode } from 'react'

interface Props {
    icon: any;
    title: string;
    value?: any;
    bgColor?: string;
    cursorPointer?: boolean
}

export const Card_M1 = ({ icon, title, value, bgColor, cursorPointer = false }: Props) => {
    return (
        <div className={`border-2 border-gray-600 px-2 py-3 rounded-lg transform transition duration-500 hover:scale-110 flex justify-center flex-col align-middle text-center ${bgColor} ${cursorPointer ? 'cursor-pointer' : ''}`}>
            <div className='mx-auto'>
                {icon}
            </div>
            <h2 className="title-font font-medium text-2xl text-gray-900">{value}</h2>
            <p className="leading-relaxed">{title}</p>
        </div>
    )
}