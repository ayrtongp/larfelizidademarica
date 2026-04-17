import React from 'react'

interface Props {
    name: string;
    label: string;
    value: string;
    disabled: boolean;
    hidden?: boolean;
    maxLength?: number;
    className?: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    password?: boolean
    pattern?: string
    placeholder?: string;
    highlightEmpty?: boolean;
}

const Text_M3: React.FC<Props> = ({ name, label, value, disabled, onChange, hidden = false, maxLength = 3000, className, password = false, pattern, placeholder, highlightEmpty = false }) => {
    const isEmpty = highlightEmpty && (!value || value === '');
    return (
        <div className={`flex flex-col ${hidden ? 'hidden' : ''} ${className}`}>
            <label htmlFor={name} className="text-xs font-bold mb-1">
                {label}
            </label>
            <input disabled={disabled} type={!password ? 'text' : 'password'} name={name} onChange={onChange} placeholder={placeholder}
                className={`p-2 border rounded-md ${isEmpty ? 'border-red-400' : ''}`} value={value} maxLength={maxLength} pattern={pattern} />
        </div>
    )
}

export default Text_M3