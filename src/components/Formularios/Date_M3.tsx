import React from 'react'

interface Props {
  name: string;
  label: string;
  value: string;
  disabled: boolean;
  hidden?: boolean;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  highlightEmpty?: boolean;
}

const Date_M3: React.FC<Props> = ({ name, label, value, disabled, onChange, hidden = false, className, highlightEmpty = false }) => {
  const isEmpty = highlightEmpty && (!value || value === '');
  return (
    <div className={`flex flex-col ${hidden ? 'hidden' : ''} ${className}`}>
      <label htmlFor={name} className="text-xs font-bold text-left pl-1">
        {label}
      </label>
      <input
        disabled={disabled}
        type="date"
        name={name}
        onChange={onChange}
        className={`p-2 border rounded-md ${isEmpty ? 'border-red-400' : ''}`}
        value={value}
      />
    </div>
  )
}

export default Date_M3
