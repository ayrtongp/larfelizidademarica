// components/SelectSearchInputM2.tsx

import React, { useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';

interface Option {
  value: string;
  label: string;
}

interface SelectWithAutocompleteProps {
  options: Option[];
  name: string;
  valor?: string;
  label2: string;
  onOptionSelect: (option: any) => void;
}

const SelectSearchInputM2: React.FC<SelectWithAutocompleteProps> = ({ name, label2, valor, options, onOptionSelect }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    if (event.target.value != "") {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }

  };

  const handleOptionClick = (option: Option) => {
    setInputValue(option.label);
    setShowSuggestions(false);
    onOptionSelect(option)
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className='w-full sm:w-[50%]'>
      <label className="pl-1 text-gray-700 text-sm font-bold mb-1" htmlFor={name}>{label2}</label>
      <div className="relative">
        <input type="text" value={inputValue} onChange={handleInputChange} name={name}
          placeholder="Digite aqui..."
          className="border rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
        />
        <RiSearchLine className="absolute right-3 top-3 text-gray-400" />
        {showSuggestions && (
          <ul className="absolute left-0 w-full mt-1 bg-white border rounded shadow-lg z-10">
            {filteredOptions.map(option => (
              <li
                key={option.value}
                className=" mx-2 my-1 py-1 border-b-2 cursor-pointer hover:bg-gray-100 over"
                onClick={() => handleOptionClick(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SelectSearchInputM2;
