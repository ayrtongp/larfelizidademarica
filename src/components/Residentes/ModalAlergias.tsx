import { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
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

      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <div className="bg-white p-4 rounded min-w-[240px] ">
          <h2 className="text-lg mb-2 font-bold text-red-500">{vars.titulo}</h2>
          {vars.lista.map((item, index) => {
            return (
              <p key={index} className='mb-1'><span>{index + 1} - </span>{item}</p>
            )
          })}
          <div className="mt-2 flex justify-center">
            <Button variant="outlined" color="primary" onClick={() => setShowModal(false)}>Fechar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
