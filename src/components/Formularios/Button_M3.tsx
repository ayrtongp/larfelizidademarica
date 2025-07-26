import React from 'react'

interface Props {
    label: string
    onClick: (e: any) => void;
    bgColor?: string;
    className?: string;
    disabled?: boolean
    type?: "submit" | "button" | "reset" | undefined;
}

const Button_M3: React.FC<Props> = ({ label, onClick, bgColor, className, disabled = false, type = 'submit' }) => {
    let classColor = "bg-indigo-500 hover:bg-indigo-700 text-white mx-auto font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    if (bgColor == "red") {
        classColor = "bg-red-500 hover:bg-red-700 text-white mx-auto font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    }
    else if (bgColor == "green") {
        classColor = "bg-green-500 hover:bg-green-700 text-white mx-auto font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    }
    else if (bgColor == "gray") {
        classColor = "bg-gray-500 hover:bg-gray-700 text-white mx-auto font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    }
    else {
        classColor = "bg-indigo-500 hover:bg-indigo-700 text-white mx-auto font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    }

    return (
        <div onClick={onClick} className={`cursor-pointer text-center ${className} flex items-center`}>
            <button type={type} disabled={disabled}
                className={classColor}>
                {label}
            </button>
        </div>
    )
}

export default Button_M3