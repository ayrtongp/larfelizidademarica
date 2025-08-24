import React, { useEffect, useState } from 'react'
import PortalBase from '@/components/Portal/PortalBase'
import CadastroCategoria from '@/components/Cadastros/CadastroCategoria'
import ListaCategorias from '@/components/Tabelas/ListaCategorias';
import CadastroInsumo from '@/components/Cadastros/CadastroInsumo';
import ListaInsumos from '@/components/Tabelas/ListaInsumos';
import GerenciarEstoque from '@/components/Gerenciar/GerenciarEstoque';
import PermissionWrapper from '@/components/PermissionWrapper';
import { getInsumosWithInventory } from '@/services/insumos.service';
import { InsumoWithInventory } from '@/models/insumos.model';

const Index = () => {

  const [opcaoAtiva, setOpcaoAtiva] = useState('');
  const [listaCategorias, setListaCategorias] = useState([]);
  const [insumos, setInsumos] = useState<InsumoWithInventory[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleButton = (e: any) => {
    setOpcaoAtiva(e.target.name)
  }

  async function getCategorias() {
    try {
      const url = '/api/Controller/Categorias?type=getAll';
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Erro na solicitação: ${res.status}`);
      }

      const data = await res.json();
      const novoArray = data.map(({ cod_categoria, nome_categoria }: any) => ({
        option: cod_categoria,
        value: nome_categoria
      }));
      setListaCategorias(novoArray)
    } catch (error) {
      console.error('Erro ao obter categorias:', error);
    }
  }

  async function getInsumos() {
    try {
      const res = await getInsumosWithInventory(1, 50)
      setInsumos(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    }
  }

  useEffect(() => {
    if (opcaoAtiva === "novo_insumo") {
      getCategorias()
    }
    else if (opcaoAtiva === "gerenciar_estoque") {
      getInsumos()
    }
  }, [opcaoAtiva]);

  return (
    <PermissionWrapper href='/portal' groups={['65cd5232828b75d5308e3315']}>
      <PortalBase>
        <div className='col-span-full flex flex-wrap gap-2 '>

          <button onClick={handleButton} name='nova_categoria'
            className={`px-4 py-2 text-white bg-purple-500 rounded-lg shadow-md text-sm hover:bg-purple-700`}>
            Nova Categoria
          </button>

          <button onClick={handleButton} name='lista_categorias'
            className={`px-4 py-2 text-white bg-purple-500 rounded-lg shadow-md text-sm hover:bg-purple-700`}>
            Lista Categorias
          </button>

          <button onClick={handleButton} name='novo_insumo'
            className={`px-4 py-2 text-white bg-purple-500 rounded-lg shadow-md text-sm hover:bg-purple-700`}>
            Novo Insumo
          </button>

          <button onClick={handleButton} name='lista_insumos'
            className={`px-4 py-2 text-white bg-purple-500 rounded-lg shadow-md text-sm hover:bg-purple-700`}>
            Lista Insumos
          </button>

          <button onClick={handleButton} name='gerenciar_estoque'
            className={`px-4 py-2 text-white bg-purple-500 rounded-lg shadow-md text-sm hover:bg-purple-700`}>
            Gerenciar Estoque
          </button>

        </div>

        <div className='col-span-full'>

          {opcaoAtiva == 'nova_categoria' && (
            <CadastroCategoria />
          )}

          {opcaoAtiva == 'lista_categorias' && (
            <ListaCategorias />
          )}

          {opcaoAtiva == 'novo_insumo' && (
            <CadastroInsumo listaDeCategorias={listaCategorias} />
          )}

          {opcaoAtiva == 'lista_insumos' && (
            <ListaInsumos />
          )}

          {opcaoAtiva == 'gerenciar_estoque' && (
            <GerenciarEstoque insumos={insumos} />
          )}

        </div>

      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index