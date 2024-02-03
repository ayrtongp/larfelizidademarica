import React, { useEffect, useState } from 'react'
import SelectInputM2 from '../Formularios/SelectInputM2';
import SubmitButtonM2 from '../Formularios/SubmitButtonM2';
import { notifyError, notifySuccess } from '@/utils/Functions';
import getInsumoResidenteLimit from '@/actions/getInsumoResidenteLimit';
import Modalpadrao from '../ModalPadrao';
import BotaoPadrao from '../BotaoPadrao';
import TextInputM2 from '../Formularios/TextInputM2';

const Suprimentos = ({ ResidenteId }: any) => {
  const [insumos, setInsumos] = useState([]);
  const [selectedInsumo, setSelectedInsumo] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [dataFraldas, setDataFraldas] = useState();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [observacoes, setObservacoes] = useState<string>('Sem observações!');


  useEffect(() => {
    async function teste() {
      const res = await getInsumoResidenteLimit({ residenteId: ResidenteId, insumoId: "65a3d04e1fe8fa8ce21eed32" })
      if (res.length > 0) {
        setDataFraldas(res[0]["soma"])
      }
    }

    teste()
  }, [])


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/Controller/Insumos?type=getCategoria&cod_categoria=fraldas');
        const data = await response.json();

        const novoArray = data.map(({ _id, nome_insumo }: any) => ({
          option: _id,
          value: nome_insumo
        }));
        const porEnquantoAPenas = [{
          option: "65a3d04e1fe8fa8ce21eed32", value: "Fralda Geriátrica (Qualquer Tamanho)",
        }] as any
        setInsumos(porEnquantoAPenas);
      } catch (error) {
        console.error('Erro ao buscar insumos:', error);
      }
    };

    fetchData();
  }, []);

  const handleInserirEstoque = async () => {
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
          }),
        });

        if (response.ok) {
          const data = await response.json();
          notifySuccess('Estoque Adicionado!')
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

      <div>
        Total de Fraldas Disponíveis: {dataFraldas}
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
    </div>

  );
};

export default Suprimentos
