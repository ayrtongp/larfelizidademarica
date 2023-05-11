import React, { useEffect, useState } from "react";
import DeleteButton from "./ModalDelete";

type Idoso = {
  _id: number;
  nome: string;
  sobrenome: string;
  usuario: string;
  tipo: string;
  status: string;
};


const TabelaUsuarios = () => {

  const [data, setData] = useState<Idoso[]>([]);

  const fetchData = async () => {
    const response = await fetch('/api/Controller/UsuarioController');
    const json = await response.json();
    setData(json);
  }


  useEffect(() => {
    fetchData()
  }, []);

  return (
    <div className="text-sm">
      <table className="table-auto border-collapse border">
        <thead>
          <tr className="bg-black font-bold text-white">
            <th className="hidden px-4 py-1 border">ID</th>
            <th className="px-4 py-1 border">Nome Usuário</th>
            <th className="px-4 py-1 border">Username</th>
            <th className="px-4 py-1 border">Admin</th>
            <th className="px-4 py-1 border">Status</th>
            <th className="px-4 py-1 border">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <tr key={user._id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
              <td className="hidden px-4 py-1 border">{user._id}</td>
              <td className="px-4 py-1 border">{user.nome + " " + user.sobrenome}</td>
              <td className="px-4 py-1 border">{user.usuario}</td>
              <td className="px-4 py-1 border">{user.tipo == '1' ? 'Sim' : 'Não'}</td>
              <td className="px-4 py-1 border">{user.status == '1' ? 'Ativo' : 'Desativado'}</td>
              <td className="px-4 py-1 border">
                <span className="cursor-pointer hover:text-red-500">
                  <DeleteButton onConfirm={fetchData} idosoData={`Usuario: ${user.usuario}`} id={user._id} url={'/api/Controller/UsuarioController'} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaUsuarios;