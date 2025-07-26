import { formatarTexto, notifyError, notifySuccess } from '@/utils/Functions';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import Checkbox from '../Formularios/CheckboxM2';
import CheckboxM2 from '../Formularios/CheckboxM2';

const AnotacoesEnfermagem = () => {
  const [ultimoRegistro, setUltimoRegistro] = useState();
  const [loading, setLoading] = useState(false);
  const [naoSeAplicaCheck, setNaoSeAplicaCheck] = useState(false);
  const router = useRouter();
  const residente_id = router.query?.id?.[0]

  const listaEnfermagem = [
    { key: "consciencia", label: 'Consciência', radio: ['Acordado', 'Orientado', 'Sonolento', 'Torporoso', 'Desorientado'] },
    { key: "hemodinamico", label: 'Hemodinâmico', radio: ['Afebril', 'Febril', 'Pirexia'] },
    { key: "cardiovascular", label: 'Cardiovascular', radio: ['Normocárdico', 'Bradicárdico', 'Taquicárdico'] },
    { key: "pressaoarterial", label: "Pressão Arterial", radio: ['Normotenso', 'Hipertenso', 'Hipotenso'] },
    { key: "respiratorio", label: "Respiratório", radio: ['Eupneico', 'Dispneico', 'Taquipneico'] },
    { key: "mucosas", label: "Mucosas", radio: ['Coradas', 'Hipocoradas'] },
    { key: "integridadecutanea", label: "Integridade Cutânea", radio: ['Hidratada', 'Desidratada'] },
    { key: "mmss", label: "MMSS", radio: ['Fragilidade Capilar', 'Edema', 'Íntegros'] },
    { key: "mmii", label: "MMII", radio: ['Fragilidade Capilar', 'Edema', 'Íntegros'] },
    { key: "aceitacaodadieta", label: "Aceitação da dieta", radio: ['Total', 'Parcial', 'Não Aceitou'] },
    { key: "abdomen", label: "Abdômen", radio: ['Globoso', 'Flácido', 'Peristáltico', 'Indolor', 'Dor'] },
    { key: "eliminacoes", label: "Eliminações", radio: ['Presente', 'Ausente', 'Fralda', 'Dor', 'Odor'] },
    { key: "eliminacoesintestinais", label: "Eliminações Intestinais", radio: ['Presente', 'Ausente', 'Constipação'] },
    { key: "auscultapulmonar", label: "Ausculta Pulmonar", radio: ['Normal', 'Anormal'] },
    { key: "observacoes", label: "Observações", textarea: "" },
  ]

  const naoSeaplica = {
    "residente_id": "", "usuario_id": "", "usuario_nome": "", "data": "",
    "consciencia": "N/A", "hemodinamico": "N/A", "cardiovascular": "N/A", "pressaoarterial": "N/A",
    "respiratorio": "N/A", "mucosas": "N/A", "integridadecutanea": "N/A", "mmss": "N/A",
    "mmii": "N/A", "aceitacaodadieta": "N/A", "abdomen": "N/A", "eliminacoes": "N/A",
    "eliminacoesintestinais": "N/A", "auscultapulmonar": "N/A", "observacoes": ""
  }
  function setRadioButtonsToFalse() {
    // Selecione todos os elementos de rádio no formulário
    const allRadioButtons = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    // Desmarque todos os elementos de rádio no formulário
    allRadioButtons.forEach(radio => {
      if (radio instanceof HTMLInputElement) {
        radio.checked = false;
      }
    });
  }

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

  const toggleCheckbox = () => {
    setNaoSeAplicaCheck((prev) => !prev);
    if (!naoSeAplicaCheck) {
      setFormData(naoSeaplica)
    }
    else {
      setFormData(camposLinhaGrid)
    }
  };

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
    setLoading(true)
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
        setFormData(camposLinhaGrid)
        notifySuccess('Adicionado com sucesso!')
        setLoading(false)
        setRadioButtonsToFalse()
      } else {
        notifyError('Houve um problema ao adicionar o registro')
        setLoading(false)
      }
    } catch (error) {
      notifyError('Erro desconhecido, contate o administrador')
      setLoading(false)
      console.error(error);
    }
  };

  return (
    <div>
      {/* ÚLTIMA ATUALIZAÇÃO */}
      <div className='text-xs text-center text-blue-500 my-2 flex flex-col'>
        <span>Última Atualização - {ultimoRegistro?.['updatedAt']}</span>
        <span>Atualizado Por: {ultimoRegistro?.['usuario_nome']}</span>
      </div>

      <div>
        <CheckboxM2 id='teste' label='Não se aplica' onChange={toggleCheckbox} isChecked={naoSeAplicaCheck} />
      </div>

      {/* {PEGAR TODOS OS CAMPOS DO TIPO RADIO, TEXTAREA FICA PRA DEPOIS} */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2"> {/* linha para cadastro */}
        {!naoSeAplicaCheck && listaEnfermagem.map((item: any, index: number) => {
          const itemFormatted = formatarTexto(item['label'])
          if (item.radio != undefined) {
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
        }
        )}
      </div>

      {/* {AQUI ENTRA O TEXTAREA} */}
      <div className="grid grid-cols-1 gap-2">
        {/* linha para cadastro */}
        {listaEnfermagem.map((item: any, index: number) => {
          const itemFormatted = formatarTexto(item['label']);
          if (item.textarea !== undefined) {
            return (
              <div key={index} className="mt-2 mb-2 border rounded-sm shadow-sm p-2">
                <label className="block font-bold mb-2">Evolução do Residente:</label>
                <div className="flex flex-row justify-between">
                  {/* Utilize a classe 'w-full' para ocupar toda a largura da div */}
                  <textarea
                    name={itemFormatted}
                    onChange={handleChange}
                    className="w-full resize-none border rounded-md p-2"
                    required
                    value={formData.observacoes}
                  />
                </div>
                <div className='mt-2 text-right text-xs text-blue-500' > Última Atualização:
                  <p className='w-full break-words'>
                    {ultimoRegistro?.[itemFormatted]}
                  </p>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* SALVAR SINAIS */}
      <div className='mx-auto mt-5 text-center'>
        <hr />
        <button disabled={loading} className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleSubmit} >
          Salvar Anotações
        </button>
      </div>

    </div >
  )
}

export default AnotacoesEnfermagem