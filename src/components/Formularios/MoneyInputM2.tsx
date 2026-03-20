import React from 'react';
import { NumericFormat } from 'react-number-format';

interface MoneyInputProps {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

const MoneyInputM2: React.FC<MoneyInputProps> = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'R$ 0,00',
}) => {
  return (
    <div>
      <label className="block text-gray-700 text-left pl-1 text-sm font-bold mb-1" htmlFor={name}>
        {label}
      </label>
      <NumericFormat
        id={name}
        name={name}
        value={value}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale
        prefix="R$ "
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onValueChange={(values) => {
          onChange(values.floatValue ?? 0);
        }}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default MoneyInputM2;
