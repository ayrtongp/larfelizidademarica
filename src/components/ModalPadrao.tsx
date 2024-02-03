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
    <div className={`fixed inset-0 overflow-y-auto ${modalClasses}`}>
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-lg ${modalClasses}`}>
          <div className='flex justify-end pr-3 py-2' onClick={onClose}>
            <MdClose size={24} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modalpadrao;
