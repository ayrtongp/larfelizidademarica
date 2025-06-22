import { sendMessage } from '@/pages/api/WhatsApp';
import { notifyError, notifySuccess } from '@/utils/Functions';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { FiCheck, FiLoader } from "react-icons/fi";
import { medicao } from '@/utils/FaixaDeAlerta';

const Semiologia = ({ residenteData }: any) => {
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

  async function notifyMessage() {
    const pas = linhaSinais.pressaoArterial.split('/')[0]
    const pad = linhaSinais.pressaoArterial.split('/')[1]
    const mensagem = medicao(residenteData.apelido, getCurrentDateTimeBrazilFormat(), linhaSinais.usuario_nome, linhaSinais.temperatura, linhaSinais.frequenciaCardiaca, linhaSinais.frequenciaRespiratoria, linhaSinais.saturacao, pas, pad)
    if (typeof (mensagem) === 'string') {
      const mensagemFinal = mensagem as string
      const messageResult = await sendMessage('120363319721988791@g.us', mensagemFinal);
    }
  }

  async function getUltimoRegistro() {
    if (residente_id) {
      const response = await axios.get(`/api/Controller/SinaisVitaisController?type=getLast&residenteId=${residente_id}`)

      if (response.status == 200) {
        await setUltimoRegistro(response.data)
      }
    }
  }

  const camposSinaisVitais = [
    { name: "pressaoArterial", nameFull: 'Pressão Arterial', type: "text", placeholder: "Pa MmHg", value: linhaSinais.pressaoArterial, maxLength: 7, pattern: "\\d{2,3}\/\\d{2,3}", title: "Formato requerido exemplo: 127/97" },
    { name: "frequenciaCardiaca", nameFull: 'Freq. Cardíaca', type: "text", placeholder: "FC bpm", value: linhaSinais.frequenciaCardiaca, maxLength: 3, pattern: "\\d+", title: "Apenas números são aceitos." },
    { name: "frequenciaRespiratoria", nameFull: 'Freq. Respiratória', type: "text", placeholder: "FR irpm", value: linhaSinais.frequenciaRespiratoria, maxLength: 3, pattern: "\\d+", title: "Apenas números são aceitos." },
    { name: "temperatura", nameFull: 'Temperatura', type: "text", placeholder: "TAX ºC", value: linhaSinais.temperatura, maxLength: 4, pattern: "\\d{2}\\.\\d", title: "Fora do padrão. Exemplo: '36.0'. 2 números, ponto, 1 número" },
    { name: "saturacao", nameFull: 'Saturação', type: "text", placeholder: "SPO2 %", value: linhaSinais.saturacao, maxLength: 3, pattern: "\\d+", title: "Apenas números são aceitos." },
    { name: "glicemiaCapilar", nameFull: 'Glicemia Capilar', type: "text", placeholder: "HGT", value: linhaSinais.glicemiaCapilar, maxLength: 3, pattern: "\\d+", title: "Apenas números são aceitos. '0' = Não se Aplica" },
    { name: "diurese", nameFull: 'Diurese', type: "text", placeholder: "Diurese", value: linhaSinais.diurese, maxLength: 7, pattern: "\\d+", title: "Apenas números são aceitos." },
    { name: "evacuacao", nameFull: 'Evacuações', type: "text", placeholder: "Evacuações", value: linhaSinais.evacuacao, maxLength: 7, pattern: "\\d+", title: "Apenas números são aceitos." },
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
    e.preventDefault()
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
        await notifyMessage()
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

      {/* ÚLTIMA ATUALIZAÇÃO */}
      <div className='text-xs text-center text-blue-500 my-2 flex flex-col'>
        <span>Última Atualização - {ultimoRegistro?.['updatedAt']}</span>
        <span>Atualizado Por: {ultimoRegistro?.['usuario_nome']}</span>
      </div>

      <form onSubmit={handleSubmit} id='divFormSinais' className="grid grid-cols-1 xs:grid-cols-3 gap-2"> {/* linha para cadastro */}
        {camposSinaisVitais.map((field, index) => {
          return (
            <div key={index} className="">
              <label className='text-xs font-bold' htmlFor={field.name}>{field.nameFull}</label>
              <input className="border border-gray-500 rounded-md p-1 w-full" onChange={handleSinais}
                name={field.name} type={field.type} placeholder={field.placeholder} value={field.value}
                pattern={field.pattern} maxLength={field.maxLength} required
                title={field.title} />
              <div className='text-right text-xs text-blue-500'>Última Atualização: {ultimoRegistro?.[field.name]}</div>
            </div>
          )
        })}

        {/* SALVAR SINAIS */}
        <div className='col-span-full mx-auto mt-5 text-center'>
          <button type='submit' className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">
            Salvar Sinais Vitais
          </button>
        </div>
      </form>

    </>
  )
}

export default Semiologia

function getCurrentDateTimeBrazilFormat() {
  let now = new Date();

  let day: any = now.getDate();
  let month: any = now.getMonth() + 1; // Months are zero-indexed, so January is 0
  let year: any = now.getFullYear();
  let hours: any = now.getHours();
  let minutes: any = now.getMinutes();
  let seconds: any = now.getSeconds();

  // Formatting to ensure two digits
  if (day < 10) {
    day = '0' + day;
  }
  if (month < 10) {
    month = '0' + month;
  }
  if (hours < 10) {
    hours = '0' + hours;
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  let formattedDate = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;

  return formattedDate;
}