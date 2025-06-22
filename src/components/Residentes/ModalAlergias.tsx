import { useState } from 'react';
import { FaTrash } from "react-icons/fa";

export default function ModalResidente({ children }: any) {
  const [showModal, setShowModal] = useState(false);

  const vars = {
    titulo: "Alergias",
    lista: ['Alergia 1', 'Alergia 2', 'Alergia 3']
  }

  return (
    <div>
      <button onClick={() => { setShowModal(true); }}>
        {children}
      </button>

    </div>
  );
}
