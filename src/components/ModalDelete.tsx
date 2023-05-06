import { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import { FaTrash } from "react-icons/fa";

export default function DeleteButton({ onConfirm, idosoData, id, url }: any) {
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDelete = async () => {
    const res = await fetch(`${url}?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setShowModal(false);
      onConfirm()
    }
  };

  return (
    <div>
      <button onClick={() => { setItemToDelete(idosoData); setShowModal(true); }}>
        <FaTrash />
      </button>

      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <div className="bg-white p-4 rounded">
          <h2 className="text-lg mb-2 font-bold text-red-500">Confirmação de Exclusão</h2>
          <p className="mb-4">Você tem certeza que deseja deletar o item abaixo?</p>
          <p>{itemToDelete}</p>
          <div className="mt-2 flex justify-between">
            <Button variant="outlined" color="primary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
