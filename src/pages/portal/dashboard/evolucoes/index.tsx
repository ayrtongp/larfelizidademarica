// components/DataTable.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import TabelaPadrao from '@/components/TabelaPadrao';
import PortalBase from '@/components/Portal/PortalBase'
import Modalpadrao from '@/components/ModalPadrao';

interface TableRow {
  // Define the structure of your row data here
  categoria: string,
  descricao: string,
  _id: string,
  apelido: string,
  createdAt: string,
  area: string,
  usuario_nome: string,
  dataEvolucao: string,
}

const DataTable: React.FC = () => {
  const [data, setData] = useState<TableRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null | string>(null);
  const [arrayModal, setArrayModal] = useState<TableRow | null>(null);

  const getLast50Results = async () => {
    try {
      const response = await axios.get(`/api/Controller/AggregateController?type=evolucao_getLast50&skip=${(currentPage - 1) * itemsPerPage}&limit=${itemsPerPage}`);
      setData(response.data.data); // Assuming the API response is an array of rows
      setTotalCount(response.data.count); // Assuming the API returns total count in the headers
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  useEffect(() => {
    getLast50Results()
  }, [currentPage])

  useEffect(() => {
    setArrayModal(data != null ? (data.find(obj => obj._id == selectedItemId) as TableRow) : null);
  }, [isModalOpen])

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const headerArrayString = ["ID", "Data Registro", "Idoso", "Categoria", "Profissional", "Descrição"]
  const arrayRows = ["_id", "createdAt", "apelido", "categoria", "usuario_nome", "descricao"]


  // Função para abrir a modal com base no id
  const openModalById = (id: any) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  // Função para fechar a modal
  const closeModal = () => {
    setSelectedItemId(null);
    setIsModalOpen(false);
  };

  return (
    <PortalBase>
      <div className='col-span-12 text-center'>
        <h1 className='text-blue-800 text-2xl'>Tabela de Evoluções</h1>
      </div>
      <div className='col-span-12 p-2'>
        <TabelaPadrao id="#tbl_evlc" resultData={data} arrayHeaderNames={headerArrayString} arrayRowsNames={arrayRows} handlePageChange={handlePageChange} onRowClick={openModalById} />
      </div>

      <Modalpadrao isOpen={isModalOpen} onClose={closeModal}>
        {arrayModal && (
          <div className="p-6">
            <h1 className="text-xl font-bold mb-1">{`${arrayModal.categoria} - ${arrayModal.apelido}`}</h1>
            <p className='text-xs text-gray-500 text-right mb-2'>Data do registro: {arrayModal.createdAt}</p>
            <p className='m-1'><span className='font-bold'>Data da evolução:</span> {arrayModal.dataEvolucao}</p>
            <p className='m-1'>{arrayModal.area} - {arrayModal.usuario_nome}</p>
            <div className='p-1 border shadow-sm rounded-md bg-gray-50'>
              <p className='my-1 text-lg font-bold'>Descrição:</p>
              <div dangerouslySetInnerHTML={{ __html: arrayModal.descricao }} />
            </div>
            <button onClick={closeModal} className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Fechar
            </button>
          </div>
        )}
      </Modalpadrao>
    </PortalBase>
  );
};

export default DataTable;