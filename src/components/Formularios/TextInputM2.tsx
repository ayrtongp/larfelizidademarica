import React from 'react';

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type Props = {
  id?: string;
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "search" | "tel" | "url";
  disabled?: boolean;
  error?: string;
  className?: string;       // Para customização extra do container
  inputClassName?: string;  // Para customização extra do input
  required?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  size?: "sm" | "md" | "lg"; // Tamanhos diferentes para o input
};


const TextInputM2: React.FC<TextInputProps> = ({ label, name, value, onChange, disabled = false }) => {
  return (
    <div className="">
      <label className="block text-gray-700 text-left pl-1 text-sm font-bold " htmlFor={name}>
        {label}
      </label>
      <input
        type="text"
        name={name}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      />
    </div>
  );
};

export default TextInputM2;
