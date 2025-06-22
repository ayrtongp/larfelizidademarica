import React, { ReactNode, useState } from 'react'

interface Props {
    titulo: string;
    child: ReactNode;
    initialExpanded?: boolean;
}

const Accordion_Modelo1 = ({ titulo, child, initialExpanded = false }: Props) => {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);


    return (
        < section className="mb-8 mx-auto border border-gray-300 rounded-md shadow-md p-4 w-[95%] bg-white" >
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h2 className="text-xl font-bold">{titulo}</h2>
                <button
                    className="focus:outline-none text-gray-500 hover:text-gray-700"
                >
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>
            {
                isExpanded && (
                    child
                )
            }
        </section >
    )
}

export default Accordion_Modelo1