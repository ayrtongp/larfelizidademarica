import React, { useEffect, useState } from 'react'
import PortalBase from '@/components/Portal/PortalBase'
import ButtonM1 from '@/components/Formularios/ButtonM1'
import ListaInsumos from '@/components/Tabelas/ListaInsumos';
import SelectSearchInputM2 from '@/components/Formularios/SelectSeachInputM2';
import getAllActiveInsumos from '@/actions/getAllActiveInsumos';
import TextInputM2 from '@/components/Formularios/TextInputM2';

interface Option {
  value: string;
  label: string;
}

interface InsumoDetalhes {
  cod_categoria: string;
  createdAt: string;
  descricao: string;
  nome_insumo: string;
  unidade: string;
  updatedAt: string;
  _id: string;
}

const Index = () => {

  const [activeButton, setActiveButton] = useState();
  const [listaInsumos, setListaInsumos] = useState([]);
  const [listaOpcoes, setListaOpcoes] = useState([]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [insumoDetalhes, setInsumoDetalhes] = useState<InsumoDetalhes>();

  useEffect(() => {
    async function insumos() {
      const data = await getAllActiveInsumos()
      const options = data.map((item: any) => ({
        value: item._id,
        label: item.nome_insumo
      }));
      setListaInsumos(data)
      setListaOpcoes(options)
    }

    insumos()
  }, [])

  useEffect(() => {
    if (selectedOption != null) {
      const detalhes = listaInsumos.find((insumo: any) => insumo._id === selectedOption.value)
      setInsumoDetalhes(detalhes)
    }
  }, [selectedOption])

  const handleOptionSelect = (option: any) => {
    setSelectedOption(option);
  };

  const handleButtonClick = (e: any) => {
    setActiveButton(e.target.name)
  }

  return (
    <PortalBase>

      <div className='col-span-full flex flex-wrap gap-2'>
        <ButtonM1 name='novo_pedido' label={"Novo Pedido"} handleButton={handleButtonClick} active={activeButton} />
        <ButtonM1 name='lista_pedidos' label={"Lista de Pedidos"} handleButton={handleButtonClick} active={activeButton} />
      </div>

      <div className='col-span-full flex flex-wrap gap-2'>
        <ListaInsumos />
      </div>

      {listaInsumos.length > 0 && (
        <div className='col-span-full flex flex-wrap gap-2'>
          <SelectSearchInputM2 name='pesquisa_insumo' label2='Pesquisa Insumo' options={listaOpcoes} onOptionSelect={handleOptionSelect} />
          <TextInputM2 disabled={true} label='Unidade' name='unidade' value={insumoDetalhes?.unidade || ""} onChange={() => null} />
          <TextInputM2 disabled={true} label='Código Categoria' name='categoria' value={insumoDetalhes?.cod_categoria || ""} onChange={() => null} />
        </div>
      )}
    </PortalBase>
  )
}

export default Index
