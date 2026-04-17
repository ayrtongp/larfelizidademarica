import React, { ReactNode, useState } from 'react'

interface Props {
    titulo: string;
    child: ReactNode;
    initialExpanded?: boolean;
    counter?: { filled: number; total: number };
}

const Accordion_Modelo1 = ({ titulo, child, initialExpanded = false, counter }: Props) => {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);


    return (
        < section className="mb-8 mx-auto border border-gray-300 rounded-md shadow-md p-4 w-[95%] bg-white" >
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{titulo}</h2>
                    {counter !== undefined && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            counter.filled === counter.total
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                        }`}>
                            {counter.filled}/{counter.total}
                        </span>
                    )}
                </div>
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