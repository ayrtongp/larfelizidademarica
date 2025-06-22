import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface Select_M3Props {
    name: string;
    label: string;
    value: string;
    className?: string;
    disabled?: boolean;
    options: SelectOption[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Select_M3: React.FC<Select_M3Props> = ({ name, label, value, disabled = false, options, onChange, className }) => {
    return (
        <div className={`flex flex-col ${className}`}>
            <label htmlFor={name} className="text-xs font-bold text-left pl-1">
                {label}
            </label>
            <select disabled={disabled} id={name} name={name} onChange={onChange} value={value || ""}
                className="p-2 border rounded-md h-[42px]">
                <option value="" disabled>
                    {"Selecione uma opção"}
                </option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Select_M3;