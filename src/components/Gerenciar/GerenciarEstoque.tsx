import { InsumoWithInventory } from '@/models/insumos.model';
import React from 'react'

interface Props {
  insumos: InsumoWithInventory[];
}

const GerenciarEstoque = ({ insumos }: Props) => {
  return (
    <div className="overflow-x-auto text-center text-sm border rounded-md shadow-xl p-2 bg-white">
      <h1 className='font-bold text-xl mx-auto my-3'>Tabela de Insumos</h1>
      <table className="table-auto border-collapse border mx-auto">
        <thead>
          <tr className="bg-black font-bold text-white">
            <th className="hidden px-4 py-1 border">ID</th>
            <th className="px-4 py-1 border">Insumo</th>
            <th className="px-4 py-1 border">Unidade de Medida</th>
            <th className="px-4 py-1 border">Categoria</th>
            <th className="px-4 py-1 border">Estoque Geral</th>
          </tr>
        </thead>
        <tbody>
          {insumos && insumos.map((obj: InsumoWithInventory, index: number) => (
            <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
              <td className="hidden px-4 py-1 border">{obj._id}</td>
              <td className="px-4 py-1 border">{obj.nome_insumo}</td>
              <td className="px-4 py-1 border">{obj.unidade}</td>
              <td className="px-4 py-1 border">{obj.cod_categoria}</td>
              <td className="px-4 py-1 border">{obj.totalQuantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default GerenciarEstoque
