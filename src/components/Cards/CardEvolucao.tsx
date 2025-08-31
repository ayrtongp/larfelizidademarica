import React, { useState } from 'react';
import { FaUserMd, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { formatDateBR, formatDateBRHora } from '@/utils/Functions';
import Modalpadrao from '../ModalPadrao';
import RichReadOnly_M3 from '../Formularios/RichReadOnly_M3';

interface CardEvolucaoProps {
  item: {
    _id: string;
    dataEvolucao: string;
    usuario_nome: string;
    area: string;
    resumo: string;
    descricao?: string;
  };
}

// Função para remover tags HTML
function stripHtml(html: string = '') {
  return html.replace(/<[^>]+>/g, '');
}

const CardEvolucao: React.FC<CardEvolucaoProps> = ({ item }) => {
  const [open, setOpen] = useState(false);

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  return (
    <>
      <div className="flex flex-col mb-2 cursor-pointer" onClick={handleOpenModal} title="Clique para ver detalhes">
        <div className="flex flex-col items-center sm:flex-row gap-2 p-3 rounded-lg shadow-sm border hover:shadow-md transition-all bg-cyan-50 hover:bg-cyan-100 border-slate-200">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            <span className="font-semibold">{formatDateBR(item.dataEvolucao)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaFileAlt className="text-gray-500" />
            <span className="italic">{item.area}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUserMd className="text-green-500" />
            <span>{item.usuario_nome}</span>
          </div>
          <div className="w-full font-bold text-left flex-1 text-xs text-gray-700 mt-2 sm:mt-0 truncate break-words">
            {item.descricao
              ? stripHtml(item.descricao).length > 80
                ? stripHtml(item.descricao).slice(0, 80) + '...'
                : stripHtml(item.descricao)
              : ''}
          </div>
        </div>
      </div>

      <Modalpadrao isOpen={open} onClose={handleCloseModal}>
        <div className="space-y-2 text-left text-sm">
          <div>
            <strong>Data:</strong> {formatDateBRHora(item.dataEvolucao)}
          </div>
          <div>
            <strong>Área:</strong> {item.area}
          </div>
          <div>
            <strong>Profissional:</strong> {item.usuario_nome}
          </div>
          <div>
            <strong>Resumo:</strong> {item.resumo}
          </div>
          {item.descricao && (
            <div>
              <strong>Descrição completa:</strong>
              <RichReadOnly_M3 label='' name='descricao' value={item.descricao} />
            </div>
          )}
        </div>
      </Modalpadrao>
    </>
  );
};

export default CardEvolucao;