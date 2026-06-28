import { useEffect, useState } from 'react';
import axios from 'axios';
import TabelaPadrao from '@/components/TabelaPadrao';
import PortalBase from '@/components/Portal/PortalBase';
import Modalpadrao from '@/components/ModalPadrao';

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

interface TableRow {
  categoria: string;
  descricao: string;
  _id: string;
  apelido: string;
  createdAt: string;
  area: string;
  usuario_nome: string;
  dataEvolucao: string;
}

const DataTable: React.FC = () => {
  const [data, setData] = useState<TableRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null | string>(null);
  const [arrayModal, setArrayModal] = useState<TableRow | null>(null);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [areaFiltro, setAreaFiltro] = useState('');
  const [areas, setAreas] = useState<string[]>([]);

  useEffect(() => {
    axios.get('/api/Controller/AggregateController?type=evolucao_areas')
      .then(r => setAreas(r.data))
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        type: 'evolucao_getLast50',
        skip: String((currentPage - 1) * itemsPerPage),
        limit: String(itemsPerPage),
      });
      if (dataInicio) params.set('dataInicio', dataInicio);
      if (dataFim) params.set('dataFim', dataFim);
      if (areaFiltro) params.set('area', areaFiltro);

      const response = await axios.get(`/api/Controller/AggregateController?${params}`);
      setData(response.data.data);
      setTotalCount(response.data.count?.[0]?.totalCount ?? 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, dataInicio, dataFim, areaFiltro]);

  useEffect(() => {
    setArrayModal(data != null ? (data.find(obj => obj._id == selectedItemId) as TableRow) : null);
  }, [isModalOpen]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltrar = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleLimparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setAreaFiltro('');
    setCurrentPage(1);
  };

  const headerArrayString = ['ID', 'Data Registro', 'Idoso', 'Categoria', 'Área', 'Profissional', 'Descrição'];
  const arrayRows = ['_id', 'createdAt', 'apelido', 'categoria', 'area', 'usuario_nome', 'descricao'];

  const openModalById = (id: any) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItemId(null);
    setIsModalOpen(false);
  };

  return (
    <PortalBase>
      <div className="col-span-12">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Evoluções</h1>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={e => { setDataInicio(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={e => { setDataFim(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
              <select
                value={areaFiltro}
                onChange={e => { setAreaFiltro(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Todas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {(dataInicio || dataFim || areaFiltro) && (
              <button
                type="button"
                onClick={handleLimparFiltros}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="p-2">
          <TabelaPadrao
            id="#tbl_evlc"
            resultData={data}
            arrayHeaderNames={headerArrayString}
            arrayRowsNames={arrayRows}
            handlePageChange={handlePageChange}
            onRowClick={openModalById}
          />
        </div>
      </div>

      <Modalpadrao isOpen={isModalOpen} onClose={closeModal}>
        {arrayModal && (
          <div className="p-6">
            <h1 className="text-xl font-bold mb-1">{`${arrayModal.categoria} - ${arrayModal.apelido}`}</h1>
            <p className="text-xs text-gray-500 text-right mb-2">Data do registro: {arrayModal.createdAt}</p>
            <p className="m-1"><span className="font-bold">Data da evolução:</span> {arrayModal.dataEvolucao}</p>
            <p className="m-1">{arrayModal.area} - {arrayModal.usuario_nome}</p>
            <div className="p-1 border shadow-sm rounded-md bg-gray-50">
              <p className="my-1 text-lg font-bold">Descrição:</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{stripHtml(arrayModal.descricao ?? '')}</p>
            </div>
            <button type="button" onClick={closeModal} className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Fechar
            </button>
          </div>
        )}
      </Modalpadrao>
    </PortalBase>
  );
};

export default DataTable;
