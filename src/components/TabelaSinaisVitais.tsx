import { formatDateBR, notifyError } from "@/utils/Functions";
import React, { useEffect, useState } from "react";
import { FaSearch, FaEdit } from 'react-icons/fa'
import DeleteButton from "./ModalDelete";

interface SinaisVitais {
  _id: string;
  idoso: string;
  data: string;
}

const TabelaSinaisVitais = () => {
  const [data, setData] = useState<SinaisVitais[]>([]);
  const [nomeIdoso, setNomeIdoso] = useState('')
  const [dataIdoso, setDataIdoso] = useState('')
  const [excludePermission, setExcludePermission] = useState(false)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {

    const countURL = '/api/Controller/SinaisVitaisController?type=countDocuments'
    const res = await fetch(countURL)
    const { count } = await res.json()

    const totalPages = Math.ceil(count / pageSize);
    setTotalPages(totalPages);

    const skip = (page - 1) * pageSize;

    const docsURL = `/api/Controller/SinaisVitaisController?type=pages&skip=${skip}&limit=${pageSize}`
    const res2 = await fetch(docsURL)
    const { data } = await res2.json()

    if (res2.ok) {
      setData(data);
    }
  }

  const isAdmin = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') as string)
    const userId = userInfo.id
    const response = await fetch(`/api/Controller/UsuarioController?id=${userId}&registro=admin`, { method: "GET", });
    const data = await response.json()
    await data.usuario?.admin === "S" ? setExcludePermission(true) : setExcludePermission(false)
  }

  const handleNameChange = (e: any) => {
    setNomeIdoso(e.target.value)
  }

  const handleDateChange = (e: any) => {
    setDataIdoso(e.target.value)
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleFilterClick = async (e: any) => {
    const response = await fetch(`/api/Controller/SinaisVitaisController?tipo=Buscar&nome=${nomeIdoso}&data=${dataIdoso}`, { method: "GET", });
    if (response.ok) {
      const json = await response.json();
      if (json.length > 0) {
        setData(json);
      } else {
        notifyError("Nenhum resultado para essa busca")
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize]);

  useEffect(() => {
    isAdmin()
  }, []);

  return (
    <div className="text-sm">
      <div className="max-w-md bg-white p-4 rounded-md shadow border mb-4 mx-auto text-center">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Filtro</h2>
          <button onClick={handleFilterClick} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Aplicar
          </button>
        </div>
        <div className="flex items-center mb-2">
          <label htmlFor="name" className="mr-2 font-medium w-24 text-gray-700">Nome:</label>
          <input type="text" id="name" name="name" className="border rounded-md px-2 py-1" onChange={handleNameChange} />
        </div>
        <div className="flex items-center">
          <label htmlFor="date" className="mr-2 font-medium w-24 text-gray-700">Data:</label>
          <input type="date" id="date" name="date" className="border rounded-md px-2 py-1" onChange={handleDateChange} />
        </div>
      </div>
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
          {data.map((obj, index) => (
            <tr key={obj._id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
              <td className="hidden px-4 py-1 border">{obj._id}</td>
              <td className="px-4 py-1 border">{obj.idoso}</td>
              <td className="px-4 py-1 border">{formatDateBR(obj.data)}</td>
              <td className="px-4 py-1 border">
                <div className="flex justify-between">
                  <a href={`/portal/sinaisvitais/${obj._id}`}>
                    <span className="cursor-pointer hover:text-blue-500"><FaSearch /></span>
                  </a>
                  <a href={`/portal/sinaisvitais/edit/${obj._id}`}>
                    <span className="cursor-pointer hover:text-blue-500"><FaEdit /></span>
                  </a>
                  {excludePermission ?
                    <span className="cursor-pointer hover:text-red-500">
                      <DeleteButton onConfirm={fetchData} idosoData={`Sinais Vitais: ${obj.idoso} | ${obj.data}`} id={obj._id} url={'/api/Controller/SinaisVitaisController'} />
                    </span>
                    : null
                  }
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 0 &&
        <div className="mt-2 flex justify-center items-center gap-3">
          <button onClick={handlePrevPage} disabled={page === 1} className="bg-blue-500 disabled:hidden hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded">
            Página Anterior
          </button>
          <button onClick={handleNextPage} disabled={page === totalPages} className="bg-blue-500 disabled:hidden hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded">
            Próxima Página
          </button>
          <span className="text-xs">Página: {page} | Total Páginas: {totalPages} </span>
        </div>
      }
      {totalPages < 1 &&
        <div className="text-center font-bold mt-3 bg-red-300">Nenhum Sinal Cadastrado!</div>
      }
    </div>
  );
};

export default TabelaSinaisVitais;