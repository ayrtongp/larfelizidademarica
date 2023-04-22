import { formatDateBR } from "@/utils/Functions";
import Link from "next/link";
import React from "react";
import { FaSearch } from 'react-icons/fa'

type SinaisVitais = {
  _id: number;
  idoso: string;
  data: string;
};

type Props = {
  SinaisVitais: SinaisVitais[];
};

const TabelaSinaisVitais: React.FC<Props> = ({ SinaisVitais }) => {
  console.log(SinaisVitais)
  return (
    <div className="text-sm">
      <table className="table-auto border-collapse border">
        <thead>
          <tr className="bg-black font-bold text-white">
            <th className="hidden px-4 py-1 border">ID</th>
            <th className="px-4 py-1 border">Nome do Idoso</th>
            <th className="px-4 py-1 border">Data</th>
            <th className="px-4 py-1 border">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {SinaisVitais.map((obj, index) => (
            <tr key={obj._id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
              <td className="hidden px-4 py-1 border">{obj._id}</td>
              <td className="px-4 py-1 border">{obj.idoso}</td>
              <td className="px-4 py-1 border">{formatDateBR(obj.data)}</td>
              <td className="px-4 py-1 border"><a href={`/portal/sinaisvitais/${obj._id}`}><FaSearch /></a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaSinaisVitais;