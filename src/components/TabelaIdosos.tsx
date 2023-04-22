import React from "react";

type Idoso = {
  id: number;
  nome_idoso: string;
  idade: number;
};

type Props = {
  idosos: Idoso[];
};

const TabelaIdosos: React.FC<Props> = ({ idosos }) => {
  return (
    <div className="text-sm">
      <table className="table-auto border-collapse border">
        <thead>
          <tr className="bg-black font-bold text-white">
            <th className="hidden px-4 py-1 border">ID</th>
            <th className="px-4 py-1 border">Nome do Idoso</th>
            <th className="px-4 py-1 border">Idade</th>
          </tr>
        </thead>
        <tbody>
          {idosos.map((idoso, index) => (
            <tr key={idoso.id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
              <td className="hidden px-4 py-1 border">{idoso.id}</td>
              <td className="px-4 py-1 border">{idoso.nome_idoso}</td>
              <td className="px-4 py-1 border">{idoso.idade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaIdosos;