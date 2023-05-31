import { formatarTexto, notifyError, notifySuccess } from '@/utils/Functions';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'

const AnotacoesEnfermagem = () => {
  const [ultimoRegistro, setUltimoRegistro] = useState();
  const router = useRouter();
  const residente_id = router.query?.id?.[0]

  const listaEnfermagem = [
    { label: 'Consciência', radio: ['Acordado', 'Orientado', 'Sonolento', 'Torporoso'] },
    { label: 'Hemodinâmico', radio: ['Afebril', 'Febril', 'Pirexia'] },
    { label: 'Cardiovascular', radio: ['Normocárdico', 'Bradicárdico', 'Taquicárdico'] },
    { label: "Pressão Arterial", radio: ['Normotenso', 'Hipertenso', 'Hipotenso'] },
    { label: "Respiratório", radio: ['Eupneico', 'Dispneico', 'Taquipneico'] },
    { label: "Mucosas", radio: ['Coradas', 'Hipocoradas'] },
    { label: "Integridade Cutânea", radio: ['Hidratada', 'Desidratada'] },
    { label: "MMSS", radio: ['Fragilidade Capilar', 'Edema', 'Íntegros'] },
    { label: "MMII", radio: ['Fragilidade Capilar', 'Edema', 'Íntegros'] },
    { label: "Aceitação da dieta", radio: ['Total', 'Parcial', 'Não Aceitou'] },
    { label: "Abdômen", radio: ['Globoso', 'Flácido', 'Peristáltico', 'Indolor', 'Dor'] },
    { label: "Eliminações", radio: ['Presente', 'Ausente', 'Fralda', 'Dor', 'Odor'] },
    { label: "Eliminações Intestinais", radio: ['Presente', 'Ausente', 'Constipação'] },
    { label: "Ausculta Pulmonar", radio: ['Normal', 'Anormal'] },
  ]

  async function getUltimoRegistro() {
    if (residente_id) {
      const response = await axios.get(`/api/Controller/AnotacoesEnfermagemController?type=getLast&residenteId=${residente_id}`)

      if (response.status == 200) {
        await setUltimoRegistro(response.data)
      }
    }
  }

  useEffect(() => {
    getUltimoRegistro()
  }, [])

  const handleChange = (e: any) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  // ########################################################################
  // ########################################################################
  // ########################################################################

  const camposLinhaGrid = {
    "residente_id": "",
    "usuario_id": "",
    "usuario_nome": "",
    "data": "",

    "consciencia": "",
    "hemodinamico": "",
    "cardiovascular": "",
    "pressaoarterial": "",
    "respiratorio": "",
    "mucosas": "",
    "integridadecutanea": "",
    "mmss": "",
    "mmii": "",
    "aceitacaodadieta": "",
    "abdomen": "",
    "eliminacoes": "",
    "eliminacoesintestinais": "",
    "auscultapulmonar": "",
    "observacoes": ""
  }

  const [formData, setFormData] = useState(camposLinhaGrid);

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      const userInfo = localStorage.getItem('userInfo');
      const parsedUserInfo = userInfo ? JSON.parse(userInfo) : null;

      if (!parsedUserInfo) { return notifyError('Problema com o login, fale com o administrador') }

      formData.usuario_id = parsedUserInfo.id
      formData.usuario_nome = parsedUserInfo.nome
      formData.data = new Date().toISOString().split('T')[0];
      residente_id ? formData.residente_id = residente_id : null

      if (!residente_id) { return notifyError('Problema com o cadastro, fale com o administrador') }

      const res = await fetch(`/api/Controller/AnotacoesEnfermagemController?type=new`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        notifySuccess('Adicionado com sucesso!')
      } else {
        notifyError('Houve um problema ao adicionar o registro')
      }
    } catch (error) {
      notifyError('Erro desconhecido, contate o administrador')
      console.error(error);
    }
  };

  return (
    <div>
      {/* TÍTULO */}
      <div className='text-center'>
        <h1 className='text-red-500 font-bold mb-2'>Anotações da Enfermagem</h1>
      </div>

      {/* ÚLTIMA ATUALIZAÇÃO */}
      <div className='text-xs text-center text-blue-500 my-2 flex flex-col'>
        <span>Última Atualização - {ultimoRegistro?.['updatedAt']}</span>
        <span>Atualizado Por: {ultimoRegistro?.['usuario_nome']}</span>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2"> {/* linha para cadastro */}
        {listaEnfermagem.map((item: any, index: number) => {
          const itemFormatted = formatarTexto(item['label'])
          return (
            <div key={index} className="mt-2 mb-2 border rounded-sm shadow-sm p-2">
              <label className="block font-bold mb-2">{item['label']}:</label>
              <div className="flex flex-col justify-between">
                {item['radio'].map((r: string, i: number) => {
                  return (
                    <label key={i}>
                      <input type="radio" name={formatarTexto(item['label'])} value={r} onChange={handleChange} className="mr-1" required />{r}
                    </label>
                  )
                })
                }
              </div>
              <div className='mt-2 text-right text-xs text-blue-500' > Última Atualização: {ultimoRegistro?.[itemFormatted]}</div>
            </div>
          )
        }
        )}
      </div>

      {/* SALVAR SINAIS */}
      <div className='mx-auto mt-5 text-center'>
        <hr />
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleSubmit} >
          Salvar Anotações
        </button>
      </div>

    </div >
  )
}

export default AnotacoesEnfermagem