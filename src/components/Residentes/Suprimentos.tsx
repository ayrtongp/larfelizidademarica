import React, { useEffect, useState } from 'react'
import SelectInputM2 from '../Formularios/SelectInputM2';
import SubmitButtonM2 from '../Formularios/SubmitButtonM2';
import { notifyError, notifySuccess } from '@/utils/Functions';
import Modalpadrao from '../ModalPadrao';
import TextInputM2 from '../Formularios/TextInputM2';
import { Insumos_GET_getAll } from '@/actions/Insumos';
import { Insumos_Estoque_GET_getHistoricoPaginado, Insumos_Estoque_GET_getListaInsumosResidente } from '@/actions/InsumosEstoque';
import { FaPlusSquare } from 'react-icons/fa';
import HistoricoSuprimentos from './Supri/HistoricoSuprimentos';
import SearchComponent from '../SearchComponent';

const Suprimentos = ({ ResidenteId }: any) => {
  const [insumos, setInsumos] = useState([]);
  const [listaInsumos, setListaInsumos] = useState([]);
  const [selectedInsumo, setSelectedInsumo] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [listaInsumosEstoque, setListaInsumosEstoque] = useState([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAddDeleteOpen, setModalAddDeletelOpen] = useState<boolean>(false);
  const [addOrDelete, setAddOrDelete] = useState<[string, string]>(['', '']);
  const [observacoes, setObservacoes] = useState<string>('Sem observações!');
  const [triggerEffect, setTriggerEffect] = useState<boolean>(false)
  const [page, setPage] = useState(1);
  const [countHistorico, setCountHistorico] = useState(0)
  const [dataHistorico, setDataHistorico] = useState<any>([])

  useEffect(() => {
    async function fetchData() {
      const res = await Insumos_Estoque_GET_getListaInsumosResidente(ResidenteId)
      if (res.length > 0) {
        setListaInsumosEstoque(res.filter((r: any) => r.soma != 0))
      }
      else {
        notifyError('Nenhum insumo em estoque encontrado')
      }
    }

    fetchData()
  }, [triggerEffect])

  useEffect(() => {
    async function fetchData() {
      const { data, count } = await Insumos_Estoque_GET_getHistoricoPaginado(ResidenteId, page)
      if (data.length > 0) {
        setDataHistorico((prevData: any) => [...prevData, ...data]);
        setCountHistorico(count)
      }
      else {
        notifyError('Nenhum insumo em estoque encontrado')
      }
    }

    fetchData()
  }, [page])


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Insumos_GET_getAll();
        const novoArray = response.map(({ _id, nome_insumo, unidade }: any) => ({
          option: _id,
          value: nome_insumo + " (" + unidade + ")"
        }));
        const novoArray2 = response.map(({ _id, nome_insumo, unidade }: any) => ({
          id: _id,
          label: nome_insumo + " (" + unidade + ")"
        }));
        setInsumos(novoArray);
        setListaInsumos(novoArray2);
      } catch (error) {
        console.error('Erro ao buscar insumos:', error);
      }
    };

    fetchData();
  }, []);

  const handleClickMostrarMais = () => {
    setPage(page + 1)
  }

  const handleCLickAddOrDelete = (e: any) => {
    const row = e.currentTarget.closest('tr');
    const insumoId = row.querySelector('[data-id]').dataset.id;
    const insumoName = row.querySelector('[data-name]').dataset.name;
    setAddOrDelete([insumoId, insumoName])
    setSelectedInsumo(insumoId)
    setModalAddDeletelOpen(true)
  }

  const handleInserirEstoque = async () => {
    const { nome: nomeUsuario, id: idUsuario } = JSON.parse(localStorage.userInfo)
    if (selectedInsumo == '' || quantidade == 0) {
      notifyError("Preencha o Insumo e a Quantidade para Inserir...")
    }
    else {
      try {
        const response = await fetch('/api/Controller/InsumoEstoque?type=addFraldaResidente', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insumo_id: selectedInsumo,
            quantidade: quantidade,
            residente_id: ResidenteId,
            observacoes: observacoes,
            nomeUsuario: nomeUsuario,
            idUsuario: idUsuario,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          notifySuccess('Estoque Adicionado!')
          setModalOpen(false)
          setModalAddDeletelOpen(false)
          setSelectedInsumo('')
          setQuantidade(0)
          setObservacoes('Sem observações!')
          setTriggerEffect(!triggerEffect)
        }
        else {
          notifyError('Erro ao adicionar fraldas')
        }
      } catch (error) {
        notifyError('Erro na requisição de fraldas')
      }
    }
  };

  const handleIncrement = () => {
    setQuantidade(quantidade + 1);
  };

  const handleDecrement = () => {
    setQuantidade(quantidade - 1);
  };

  return (
    <div>

      <div>
        <ul className='flex flex-row flex-wrap gap-2'>
          {/* ITEM */}
          <li id='rel-sinais' onClick={() => setModalOpen(true)}>
            <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
              Adicionar Estoque
            </button>
          </li>
        </ul>
      </div>

      <hr className='mt-5' />

      <div className='overflow-auto my-4 text-center border shadow-md rounded-md p-2'>
        <table className='text-xs mx-auto whitespace-nowrap'>
          <thead>
            <tr>
              <th className='hidden'>ID Insumo</th>
              <th className='pb-2'>Categoria</th>
              <th className='pb-2'>Nome Insumo</th>
              <th className='pb-2'>Unidade</th>
              <th className='pb-2'>Estoque</th>
              <th className='pb-2'>Ações</th>
            </tr>
          </thead>
          <tbody>
            {listaInsumosEstoque.length > 0 && listaInsumosEstoque.map((insumo: any, index: number) => (
              <tr key={index} className='border-b hover:bg-green-200'>
                <td data-id={insumo._id} className='hidden'>{insumo._id}</td>
                <td data-name={insumo.nome_insumo} className='pt-1 px-2'>{insumo.cod_categoria}</td>
                <td className='pt-1 px-2 text-left'>{insumo.nome_insumo}</td>
                <td className='pt-1 px-2 text-center'>{insumo.unidade}</td>
                <td className='pt-1 px-2 text-right'>{insumo.soma}</td>
                <td className='pt-1 px-2'>
                  <div className='flex flex-row gap-2 justify-end'>
                    <FaPlusSquare size={14} fill='green' className='cursor-pointer' onClick={handleCLickAddOrDelete} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='overflow-auto my-4 text-center border shadow-md rounded-md p-2 text-xs'>
        <HistoricoSuprimentos listaHistorico={dataHistorico} countHistorico={countHistorico} clicked={handleClickMostrarMais} />
      </div>

      <Modalpadrao isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className='border rounded shadow p-3'>
          <h1 className='text-lg font-bold mb-4'>Adicionar Insumo</h1>
          <div>
            <SelectInputM2 options={insumos} name='insumoSelect' label='Selecionar Insumo' value={selectedInsumo} onChange={(e: any) => setSelectedInsumo(e.target.value)} />
          </div>

          <div className='my-3'>
            <label className='block text-gray-700 text-sm font-bold' htmlFor="quantidadeInput">Quantidade:</label>
            <div className='inline-flex flex-row border-2 border-blue-500 rounded-sm'>
              <button className={`${quantidade < 0 ? 'bg-red-500' : 'bg-blue-500'} text-white px-2 py-1 `} onClick={handleDecrement}>-</button>
              <input className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-8 pl-3'
                type="number"
                id="quantidadeInput"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value))}
              />
              <button className={`${quantidade < 0 ? 'bg-red-500' : 'bg-blue-500'} text-white px-2 py-1 `} onClick={handleIncrement}>+</button>
            </div>
          </div>

          <div>
            <TextInputM2 disabled={false} label='Observações' name='observacoes' value={observacoes} onChange={(e: any) => setObservacoes(e.target.value)} />
          </div>

          <SubmitButtonM2 label={`${quantidade < 0 ? 'Remover Estoque' : 'Adicionar Estoque'}`} onClick={handleInserirEstoque} color={`${quantidade < 0 ? "red" : "blue"}`} />
        </div>
      </Modalpadrao>

      <Modalpadrao isOpen={modalAddDeleteOpen} onClose={() => setModalAddDeletelOpen(false)}>
        <div className='border rounded shadow p-3'>
          <h1 className='text-lg font-bold mb-4'>{`${quantidade < 0 ? 'Remover Estoque' : 'Adicionar Estoque'}`}</h1>
          <div>
            <TextInputM2 disabled label='Insumo' name='insumo' value={addOrDelete[1]} onChange={() => null} />
          </div>

          <div className='my-3'>
            <label className='block text-gray-700 text-sm font-bold' htmlFor="quantidadeInput">Quantidade:</label>
            <div className='inline-flex flex-row border-2 border-blue-500 rounded-sm'>
              <button className={`${quantidade < 0 ? 'bg-red-500' : 'bg-blue-500'} text-white px-2 py-1 `} onClick={handleDecrement}>-</button>
              <input className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-8 pl-3'
                type="number"
                id="quantidadeInput"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value))}
              />
              <button className={`${quantidade < 0 ? 'bg-red-500' : 'bg-blue-500'} text-white px-2 py-1 `} onClick={handleIncrement}>+</button>
            </div>
          </div>

          <div>
            <TextInputM2 disabled={false} label='Observações' name='observacoes' value={observacoes} onChange={(e: any) => setObservacoes(e.target.value)} />
          </div>

          <SubmitButtonM2 label={`${quantidade < 0 ? 'Remover Estoque' : 'Adicionar Estoque'}`} onClick={handleInserirEstoque} color={`${quantidade < 0 ? "red" : "blue"}`} />
        </div>
      </Modalpadrao>
    </div>

  );
};

export default Suprimentos