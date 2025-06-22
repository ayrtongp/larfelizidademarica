// components/CheckboxM2.tsx

import React, { useState } from 'react';
import classnames from 'classnames';

interface CheckboxProps {
  label: string;
  isChecked: boolean;
  onChange: () => void;
}

const CheckboxM2: React.FC<CheckboxProps> = ({ label, isChecked, onChange }) => {

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={label}
        checked={isChecked}
        onChange={onChange}
        className="mr-2"
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
