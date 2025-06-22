import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: any;
}

const Modalpadrao: React.FC<ModalProps> = ({ isOpen, onClose, children, }) => {
  const modalClasses = isOpen ? 'block' : 'hidden';

  return (
    <div className={`fixed inset-0 overflow-y-auto ${modalClasses} z-50 `}>
      <div className="flex items-end justify-center min-h-screen py-4 px-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-2 sm:align-middle w-[95%] sm:w-full sm:max-w-[80%] ${modalClasses}`}>
          <div className='flex justify-end pr-3 py-2' onClick={onClose}>
            <MdClose size={24} />
          </div>
          <div className='p-4'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modalpadrao;
