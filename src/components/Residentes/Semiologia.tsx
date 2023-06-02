import { notifyError, notifySuccess } from '@/utils/Functions';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { FiCheck, FiLoader } from "react-icons/fi";

const Semiologia = () => {

  const camposLinhaGrid = {
    residente_id: '', usuario_id: '', usuario_nome: '',
    pressaoArterial: '', frequenciaCardiaca: '', frequenciaRespiratoria: '',
    temperatura: '', saturacao: '', glicemiaCapilar: '', diurese: '', evacuacao: '',
  }

  const [loading, setLoading] = useState(false);
  const [ultimoRegistro, setUltimoRegistro] = useState();
  const [linhaSinais, setLinhasSinais] = useState(camposLinhaGrid);
  const router = useRouter();
  const residente_id = router.query?.id?.[0]

  async function getUltimoRegistro() {
    if (residente_id) {
      const response = await axios.get(`/api/Controller/SinaisVitaisController?type=getLast&residenteId=${residente_id}`)

      if (response.status == 200) {
        await setUltimoRegistro(response.data)
      }
    }
  }

  const camposSinaisVitais = [
    { name: "pressaoArterial", nameFull: 'Pressão Arterial', type: "text", placeholder: "Pa MmHg", value: linhaSinais.pressaoArterial, },
    { name: "frequenciaCardiaca", nameFull: 'Freq. Cardíaca', type: "text", placeholder: "FC bpm", value: linhaSinais.frequenciaCardiaca, },
    { name: "frequenciaRespiratoria", nameFull: 'Freq. Respiratória', type: "text", placeholder: "FR irpm", value: linhaSinais.frequenciaRespiratoria, },
    { name: "temperatura", nameFull: 'Temperatura', type: "text", placeholder: "TAX ºC", value: linhaSinais.temperatura, },
    { name: "saturacao", nameFull: 'Saturação', type: "text", placeholder: "SPO2 %", value: linhaSinais.saturacao, },
    { name: "glicemiaCapilar", nameFull: 'Glicemia Capilar', type: "text", placeholder: "HGT", value: linhaSinais.glicemiaCapilar, },
    { name: "diurese", nameFull: 'Diurese', type: "text", placeholder: "Diurese", value: linhaSinais.diurese, },
    { name: "evacuacao", nameFull: 'Evacuações', type: "text", placeholder: "Evacuações", value: linhaSinais.evacuacao, },
  ]

  useEffect(() => {
    getUltimoRegistro()
  }, [])

  const handleSinais = (e: any) => {
    setLinhasSinais((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: any) => {
    setLoading(true)
    try {
      const userInfo = localStorage.getItem('userInfo');
      const parsedUserInfo = userInfo ? JSON.parse(userInfo) : null;

      if (!parsedUserInfo) { return notifyError('Problema com o login, fale com o administrador') }

      linhaSinais.usuario_id = parsedUserInfo.id
      linhaSinais.usuario_nome = parsedUserInfo.nome
      residente_id ? linhaSinais.residente_id = residente_id : null

      if (!residente_id) { return notifyError('Problema com o cadastro, fale com o administrador') }

      const res = await fetch(`/api/Controller/SinaisVitaisController?type=new`, {
        method: 'POST',
        body: JSON.stringify(linhaSinais),
      });
      if (res.ok) {
        notifySuccess('Sinal(is) Adicionado(s) com sucesso!')
        setLinhasSinais(camposLinhaGrid)
      } else {
        notifyError('Houve um problema ao adicionar os Sinais Vitais')
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
        <h1 className='text-red-500 font-bold mb-2'>Sinais Vitais</h1>
      </div>

      {/* ÚLTIMA ATUALIZAÇÃO */}
      <div className='text-xs text-center text-blue-500 my-2 flex flex-col'>
        <span>Última Atualização - {ultimoRegistro?.['updatedAt']}</span>
        <span>Atualizado Por: {ultimoRegistro?.['usuario_nome']}</span>
      </div>

      <div id='divFormSinais' className="grid grid-cols-1 xs:grid-cols-3 gap-2"> {/* linha para cadastro */}
        {camposSinaisVitais.map((field, index) => {
          return (
            <div key={index} className="">
              <label className='text-xs font-bold' htmlFor={field.name}>{field.nameFull}</label>
              <input
                className="border border-gray-500 rounded-md p-1 w-full"
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={handleSinais}
              />
              <div className='text-right text-xs text-blue-500'>Última Atualização: {ultimoRegistro?.[field.name]}</div>
            </div>
          )
        })}
      </div>

      {/* SALVAR SINAIS */}
      <div className='mx-auto mt-5 text-center'>
        <hr />
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleSubmit} >
          Salvar Sinais Vitais
        </button>
      </div>

    </>
  )
}

export default Semiologia