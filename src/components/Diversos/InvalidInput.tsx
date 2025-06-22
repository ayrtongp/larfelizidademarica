import React, { useState } from 'react'

interface Props {
    label: string;
    placeholder: string;
    invalidValue: string;
    name: string
    isInvalid?: boolean
}

const InvalidInput = ({ label, placeholder, invalidValue, name, isInvalid = false }: Props) => {

    return (
        <div className="my-4 max-w-sm mx-auto">
            <label className="block text-gray-700 font-bold mb-1" htmlFor={name}>
                {label}
            </label>
            <input name={name} type="text" placeholder={placeholder}
                className={`input-blink shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${isInvalid ? 'border-red-500' : ''} `} />
            {isInvalid && <p className="input-blink text-red-500 text-xs italic mt-1">{invalidValue}</p>}
        </div>
    )
}

export default InvalidInput