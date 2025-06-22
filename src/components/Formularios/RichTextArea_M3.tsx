'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Props {
    name: string;
    label: string;
    onChange: (name: string, value: string) => void;
    value?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
}

const RichText_M3: React.FC<Props> = ({
    name,
    label,
    onChange,
    value = '',
    className = '',
    placeholder = 'Digite aqui...',
    disabled = false,
}) => {
    const handleChange = (content: string) => {
        onChange(name, content);
    };

    return (
        <div className={`text-left flex flex-col resize-y overflow-auto mb-4 ${className}`}>
            <label htmlFor={name} className="text-xs font-bold mb-1 pl-1">
                {label}
            </label>

            <ReactQuill
                value={value}
                onChange={handleChange}
                readOnly={disabled}
                placeholder={placeholder}
                modules={{
                    toolbar: [
                        [{ header: [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['clean'],
                    ],
                }}
                formats={[
                    'header',
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'color',
                    'background',
                    'list',
                    'bullet',
                ]}
                className={`bg-white border rounded-md h-[100%] overflow-auto ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
                theme="snow"
            />
        </div>
    );
};

export default RichText_M3;
