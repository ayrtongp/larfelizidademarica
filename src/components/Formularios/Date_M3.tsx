import React from 'react'

interface Props {
  name: string;
  label: string;
  value: string;
  disabled: boolean;
  hidden?: boolean;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Date_M3: React.FC<Props> = ({ name, label, value, disabled, onChange, hidden = false, className }) => {
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
        className="p-2 border rounded-md"
        value={value}
      />
    </div>
  )
}

export default Date_M3
