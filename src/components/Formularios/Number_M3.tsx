import React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface Props {
    name: string;
    label: string;
    value: number;
    disabled: boolean;
    hidden?: boolean;
    maxLength?: number;
    maxValue?: number;
    className?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Number_M3: React.FC<Props> = ({
    name,
    label,
    value,
    disabled,
    onChange,
    hidden = false,
    maxLength,
    maxValue,
    className,
}) => {
    return (
        <div className={`flex flex-col ${hidden ? 'hidden' : ''} ${className}`}>
            <label htmlFor={name} className="text-xs font-bold pl-1 text-left">
                {label}
            </label>
            <NumericFormat
                id={name}
                name={name}
                value={value}
                disabled={disabled}
                allowNegative={false}
                isAllowed={(values) => {
                    const { floatValue } = values;
                    if (floatValue === undefined) return true;
                    if (maxValue !== undefined && floatValue > maxValue) return false;
                    return true;
                }}
                onValueChange={(values) => {
                    // Emula o comportamento do React ChangeEvent para manter compatibilidade
                    const event = {
                        target: {
                            name,
                            value: values.floatValue ?? 0,
                        },
                    } as unknown as React.ChangeEvent<HTMLInputElement>;

                    onChange(event);
                }}
                className="p-2 border rounded-md"
                maxLength={maxLength}
                thousandSeparator="."
                decimalSeparator=","
            />
        </div>
    );
};

export default Number_M3;
