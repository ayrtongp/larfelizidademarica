import { formatDateBR, notifyError } from "@/utils/Functions";
import React, { useEffect, useState } from "react";
import { FaSearch, FaEdit } from 'react-icons/fa'

interface Categoria {
  _id: string;
  is_ativo: string;

  cod_categoria: string;
  nome_categoria: string;
  descricao: string;

  createdAt: string;
  updatedAt: string;
}

const ListaCategorias = () => {
  const [data, setData] = useState<Categoria[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const tableConfig = {
    headers: ['ID', 'Código', 'Categoria', 'Ativo'],
    rows: ['_id', 'cod_categoria', 'nome_categoria', 'is_ativo']
  }

  const fetchData = async () => {

    const url = '/api/Controller/Categorias?type=getAll'
    const res = await fetch(url)

    if (res.ok) {
      const result = await res.json()
      setData(result)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize]);

  return (
    <div className="text-center text-sm border rounded-md shadow-xl p-2 bg-white">
      <h1 className='font-bold text-xl mx-auto my-3'>Tabela de Categorias</h1>
      <table className="table-auto border-collapse border mx-auto">
        <thead>
          <tr className="bg-black font-bold text-white">
            <th className="hidden px-4 py-1 border">ID</th>
            <th className="px-4 py-1 border">Código</th>
            <th className="px-4 py-1 border">Categoria</th>
            <th className="px-4 py-1 border">Ativo</th>
          </tr>
        </thead>
        <tbody>
          {data && data.map((obj, index) => (
            <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
              <td className="hidden px-4 py-1 border">{obj._id}</td>
              <td className="px-4 py-1 border">{obj.cod_categoria}</td>
              <td className="px-4 py-1 border">{obj.nome_categoria}</td>
              <td className="px-4 py-1 border">{obj.is_ativo}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default ListaCategorias;