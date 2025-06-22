'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Props {
    name: string;
    label: string;
    value?: string;
    className?: string;
}

const RichReadOnly_M3: React.FC<Props> = ({
    name,
    label,
    value = '',
    className = '',
}) => {

    return (
        <div className={`text-left flex flex-col resize-y overflow-auto mb-4 ${className}`}>
            <label htmlFor={name} className="text-xs font-bold mb-1 pl-1">
                {label}
            </label>

            <ReactQuill
                value={value}
                readOnly={true}
                modules={{ toolbar: false }}
                className={`h-[100%] overflow-auto ${true ? 'bg-gray-100 text-gray-500' : ''}`}
                theme="snow"
            />
        </div>
    );
};

export default RichReadOnly_M3;
