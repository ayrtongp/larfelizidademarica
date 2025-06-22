import { notifyError, notifySuccess } from '@/utils/Functions';
import { getUserFuncao } from '@/utils/Login';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { FiCheck, FiLoader } from "react-icons/fi";
import RichText_M3 from '../Formularios/RichTextArea_M3';

const Evolucao = () => {

  const camposLinhaGrid = {
    categoria: 'Evolução',
    dataEvolucao: '',
    descricao: '',
    area: getUserFuncao(),

    residente_id: '',
    usuario_id: '',
    usuario_nome: '',
  }

  const [loading, setLoading] = useState(false);
  const [funcao, setFuncao] = useState(getUserFuncao());
  const [ultimoRegistro, setUltimoRegistro] = useState();
  const [linhaEvolucao, setLinhaEvolucao] = useState(camposLinhaGrid);
  const [categoriaValue, setCategoriaValue] = useState('Selecione uma Opção');
  const router = useRouter();
  const residente_id = router.query?.id?.[0]

  async function getUltimoRegistro() {
    if (residente_id) {
      const response = await axios.get(`/api/Controller/EvolucaoController?type=getLast&residenteId=${residente_id}`)

      if (response.status == 200) {
        await setUltimoRegistro(response.data)
      }
    }
  }

  useEffect(() => {
    getUltimoRegistro()
  }, [])

  const handleEvolucao = (e: any) => {
    setLinhaEvolucao((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleRichTextChange = (name: string, value: string) => {
    setLinhaEvolucao((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectCategoria = (e: any) => {
    setLinhaEvolucao((prevState) => ({
      ...prevState,
      categoria: e.target.value
    }));
  }

  const handleSubmit = async (e: any) => {
    setLoading(true)
    try {
      const userInfo = localStorage.getItem('userInfo');
      const parsedUserInfo = userInfo ? JSON.parse(userInfo) : null;

      if (!parsedUserInfo) { return notifyError('Problema com o login, fale com o administrador') }

      linhaEvolucao.usuario_id = parsedUserInfo.id
      linhaEvolucao.usuario_nome = parsedUserInfo.nome
      residente_id ? linhaEvolucao.residente_id = residente_id : null

      if (!residente_id) { return notifyError('Problema com o cadastro, fale com o administrador') }

      const res = await fetch(`/api/Controller/EvolucaoController?type=new`, {
        method: 'POST',
        body: JSON.stringify(linhaEvolucao),
      });
      if (res.ok) {
        notifySuccess('Evolução Adicionada com sucesso!')
        setLinhaEvolucao(camposLinhaGrid)
      } else {
        notifyError('Houve um problema ao adicionar a Evolução')
      }
    } catch (error) {
      notifyError('Erro desconhecido, contate o administrador')
      console.error(error);
    }

    setLoading(false)
  };

  return (
    <>
      {loading ? (
        <div className='fixed inset-0 flex flex-col justify-center items-center bg-gray-500 bg-opacity-80 z-50'>
          <div className="text-4xl text-gray-600">
            <FiLoader className="animate-spin" />
          </div>
          <h3 className='animate-pulse text-gray-600 font-bold text-2xl'>Carregando...</h3>
        </div>
      ) : (
        null
      )
      }

      {/* TÍTULO */}
      <div className='text-center'>
        <h1 className='text-red-500 font-bold mb-2'>Evolução</h1>
      </div>

      {/* ÚLTIMA ATUALIZAÇÃO */}
      <div className='text-xs text-center text-blue-500 my-2 flex flex-col'>
        <span>Última Atualização - {ultimoRegistro?.['updatedAt']}</span>
        <span>Atualizado Por: {ultimoRegistro?.['usuario_nome']}</span>
      </div>

      <div id='divFormEvolucao' className="grid grid-cols-1 xs:grid-cols-3 gap-2"> {/* linha para cadastro */}

        <div className='col-span-1 xs:col-span-3'>
          <select name='categoria' onChange={handleEvolucao} value={linhaEvolucao.categoria} className="w-full p-3 rounded-md border border-gray-300 focus:ring focus:ring-blue-300" >
            <option value="Evolução">Evolução</option>
            <option value="Informação">Informação</option>
            <option value="Medicação">Medicação</option>
            <option value="Prescrição">Prescrição</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div className='col-span-1 xs:col-span-1'>
          <label className='text-xs font-bold' htmlFor="area">Área de Atuação</label>
          <input type="text" name='area' disabled value={funcao as unknown as string} onChange={handleEvolucao}
            className="w-full p-3 rounded-md border border-gray-300 focus:ring focus:ring-blue-300" />
        </div>

        <div className='col-span-1 xs:col-span-2'>
          <label className='text-xs font-bold' htmlFor="dataEvolucao">Data da Evolução</label>
          <input type="date" name='dataEvolucao' onChange={handleEvolucao}
            className="w-full p-3 rounded-md border border-gray-300 focus:ring focus:ring-blue-300" />
        </div>

        <div className='col-span-1 xs:col-span-3 w-full'>
          <RichText_M3
            name="descricao"
            label="Descrição Detalhada"
            value={linhaEvolucao.descricao}
            onChange={handleRichTextChange}
            className="mt-2"
            placeholder="Digite aqui a descrição detalhada..."
            rows={5}
          />
        </div>

      </div>

      {/* SALVAR SINAIS */}
      <div className='mx-auto mt-5 text-center'>
        <hr />
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleSubmit} >
          Salvar Evolução
        </button>
      </div>

    </>
  )
}

export default Evolucao