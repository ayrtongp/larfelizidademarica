import React from 'react'

interface Props {
    name: string;
    label: string
    value: number;
    disabled: boolean;
    hidden?: boolean;
    maxLength?: number;
    className?: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Number_M3: React.FC<Props> = ({ name, label, value, disabled, onChange, hidden = false, maxLength = 3000, className }) => {
    return (
        <div className={`flex flex-col ${hidden ? 'hidden' : ''} ${className}`}>
            <label htmlFor={name} className="text-xs font-bold mb-1">
                {label}
            </label>
            <input disabled={disabled} type={'number'} name={name} onChange={onChange}
                className="p-2 border rounded-md" value={value} maxLength={maxLength} />
        </div>
    )
}

export default Number_M3