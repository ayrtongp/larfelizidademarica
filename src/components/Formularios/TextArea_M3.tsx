import React from 'react'

interface Props {
    name: string;
    label: string;
    onChange: (e: any) => void;
    rows?: number;
    value?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

const Textarea_M3: React.FC<Props> = ({ name, label, value, onChange, placeholder, rows = 4, disabled = false, className }) => {
    return (
        <div className={`text-left flex flex-col mb-4 ${className}`}>
            <label className='text-xs font-bold mb-1 pl-1' htmlFor={name}>{label}</label>
            <textarea disabled={disabled} className='w-full p-2 border rounded-md' rows={rows} name={name} value={value} onChange={onChange} placeholder={placeholder} />
        </div>
    )
}

export default Textarea_M3