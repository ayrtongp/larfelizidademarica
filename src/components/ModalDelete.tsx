import { useState } from 'react';
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

    </div>
  );
}
