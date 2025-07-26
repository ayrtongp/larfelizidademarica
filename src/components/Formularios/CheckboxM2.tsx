// components/CheckboxM2.tsx

import React, { useState } from 'react';
import classnames from 'classnames';

interface CheckboxProps {
  label: string;
  isChecked: boolean;
  onChange: (e: React.ChangeEvent) => void;
  id: string;
  className?: string;
}

const CheckboxM2: React.FC<CheckboxProps> = ({ label, isChecked, onChange, id, className }) => {

  return (
    <div className={classnames("flex items-center", className)}>
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={onChange}
        className={classnames('mr-2')}
      />
      <label
        htmlFor={label}
        className={classnames('cursor-pointer', { 'text-green-600': isChecked })}
      >
        {label}
      </label>
    </div>
  );
};

export default CheckboxM2;
