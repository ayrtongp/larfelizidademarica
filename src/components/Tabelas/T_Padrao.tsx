import getInsumoResidenteLimit from "@/actions/getInsumoResidenteLimit";
import { formatDateBR, notifyError } from "@/utils/Functions";
import React, { useEffect, useState } from "react";
import { FaSearch, FaEdit } from 'react-icons/fa'

interface Categoria {
  _id: string;

  nome_insumo: string;
  unidade: string;
  cod_categoria: string;
  descricao: string;

  createdAt: string;
  updatedAt: string;
}

interface Props {
  tableName: string;
  data: any;
  columnNames: string[];
  columnHidden: string[];
}

const T_Padrao = ({ tableName, data, columnNames, columnHidden }: Props) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const tableConfig = {
    headers: ['ID', 'Código', 'Categoria', 'Ativo'],
    rows: ['_id', 'cod_categoria', 'nome_categoria', 'is_ativo']
  }


  return (
    <div className="text-center text-sm border rounded-md shadow-xl p-2 bg-white">
      <h1 className='font-bold text-xl mx-auto my-3'>{tableName}</h1>
      <table className="table-auto border-collapse border mx-auto">
        <thead>
          <tr className="bg-black font-bold text-white">
            {columnNames.length > 0 && columnNames.map((name: string, indexTh: number) => {
              if (columnHidden.includes(name))
                return (<th key={indexTh} className="hidden px-4 py-1 border">{name}</th>)
              else
                return (<th key={indexTh} className="px-4 py-1 border">{name}</th>)
            })}
          </tr>
        </thead>
        <tbody>
          {data && data.map(([key, value]: any, index: number) => {
            return (
              <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                {key.map((item: any, index3: number) => {
                  <>
                    <td className="hidden px-4 py-1 border">{item}</td>
                    <td className="px-4 py-1 border">{item.nome_insumo}</td>
                  </>

                })}
              </tr>
            )
          }
          )}
        </tbody>
      </table>

    </div>
  );
};

export default T_Padrao;