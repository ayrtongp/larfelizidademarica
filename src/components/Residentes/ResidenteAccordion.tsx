import React, { useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

const ResidenteAccordion = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  }

  return (
    <div id="accordion-arrow-icon" data-accordion={isOpen ? 'open' : 'closed'}>
      <h2 id="accordion-arrow-icon-heading-2" onClick={toggleAccordion}>
        <button type="button" className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded={isOpen} aria-controls="accordion-arrow-icon-body-2">
          <span>Dados Cadastrais</span>
          {!isOpen ? <FaChevronDown /> : <FaChevronUp />}
        </button>
      </h2>
      <div id="accordion-arrow-icon-body-2" className={`transition duration-300 ease-in-out ${isOpen ? 'block' : 'hidden'}`}
        aria-labelledby="accordion-arrow-icon-heading-2">
        <div className="p-5 border border-b-0 border-gray-200 dark:border-gray-700">
          <p>Dados do idoso</p>
        </div>
      </div>
    </div>
  )
}

export default ResidenteAccordion
