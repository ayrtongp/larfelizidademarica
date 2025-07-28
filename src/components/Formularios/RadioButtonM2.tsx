import React from 'react';

interface RadioButtonProps {
    label: string;
    name: string;
    value: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

const RadioButtonM2: React.FC<RadioButtonProps> = ({
    label,
    name,
    value,
    checked,
    onChange,
    disabled = false
}) => {
    return (
        <div className="flex items-center space-x-2">
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
            />
            <label
                htmlFor={`${name}-${value}`}
                className={`text-sm font-medium text-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {label}
            </label>
        </div>
    );
};

export default RadioButtonM2;
