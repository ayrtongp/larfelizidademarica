import { useEffect, useState } from "react";
import { listaEnfermagem, listaIdosos } from '../utils/Listas'
import { notifyError, notifySuccess } from "@/utils/Functions";
import { getUserID } from "@/utils/Login";
import GridSinaisVitais from "./GridSinaisVitais";
import { useRouter } from "next/router";

function formatarTexto(texto: string) {
  // Remove acentos e converte para minúsculo
  texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Remove espaços em branco no início e fim da string
  texto = texto.trim();
  // Remove todos os espaços em branco da string
  texto = texto.replace(/\s+/g, '');
  return texto;
}

const FormSinaisVitais = () => {
  const router = useRouter();
  const [sinalData, setSinalData] = useState("");
  const [formData, setFormData] = useState({
    "idoso": "", "idoso_id": "", "data": "", "datalancamento": Date.now(),
    "consciencia": "", "hemodinamico": "", "cardiovascular": "", "pressaoarterial": "",
    "respiratorio": "", "mucosas": "", "integridadecutanea": "", "mmss": "",
    "mmii": "", "aceitacaodadieta": "", "abdomen": "", "eliminacoes": "",
    "eliminacoesintestinais": "", "auscultapulmonar": "", "observacoes": "",
    "id_usuario_cadastro": "", "nome_usuario": "", "registro_usuario": "", "funcao_usuario": "", "lista_sinais": [{}]
  })

  useEffect(() => {
    const selectElement = document.getElementById('idoso') as HTMLSelectElement;
    const optionValue = 'Escolha o nome do idoso';
    const selectedOption = selectElement.querySelector(`option[value="${optionValue}"]`) as HTMLOptionElement;
    selectedOption.selected = true;
    teste()
  }, []);

  const teste = async () => {
    const getRegistro = await fetch(`/api/Controller/Usuario?registro=getRegistro&id=${getUserID()}`, {
      method: "GET",
    });
    const registoJson = await getRegistro.json()
    setFormData((prevState) => ({
      ...prevState,
      id_usuario_cadastro: registoJson.usuario._id,
      nome_usuario: registoJson.usuario.nome + " " + registoJson.usuario.sobrenome,
      registro_usuario: registoJson.usuario.registro,
      funcao_usuario: registoJson.usuario.funcao,
    }));
  }


  const handleSubmit = async (event: any) => {
    event.preventDefault()
    if (!formData.idoso || !formData.idoso_id) {
      event.preventDefault()
      alert('Selecione o nome do idoso');
      return
    }

    const res = await fetch("/api/Controller/SinaisVitaisController", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (res.ok) {
      notifySuccess("Formulário cadastrado com sucesso!")
      setSinalData(data)
      router.push('/portal/sinaisvitais')
    } else {
      notifyError(data.message)
    }
  };

  const handleChange = (e: any) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleChangeIdoso = (e: any) => {
    const IdosoListElement = document.getElementById('idoso') as HTMLSelectElement
    const idosoId = IdosoListElement.selectedOptions[0].getAttribute('id')
    if (idosoId !== null) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value,
        idoso_id: idosoId
      }))
    }

  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">

        <div className="mt-4 mb-4 border rounded p-2 flex flex-wrap">
          <div>
            <label className="block font-bold mb-2" htmlFor="idoso">Nome do idoso:</label>
            <select name="idoso" id="idoso" required onChange={handleChangeIdoso}
              className="max-w-[250px] bg-gray-200 text-gray-700 border border-gray-400 rounded px-1 py-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
              <option disabled value="Escolha o nome do idoso">Escolha o nome do idoso</option>
              {listaIdosos.sort((a, b) => (a.nome_idoso > b.nome_idoso) ? 1 : -1).map(idoso => (
                <option id={idoso.id.toString()} key={idoso.id} value={`${idoso.nome_idoso}`}>{idoso.nome_idoso}</option>
              ))}
            </select>
          </div>

          <div className="max-w-[270px] m-2 bg-gray-200 text-gray-700 border border-gray-400 rounded px-4 py-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" >
            <label htmlFor="data" className="block font-bold mb-2">Data:</label>
            <input className="bg-gray-200" type="date" id="data" name="data" onChange={handleChange} required></input>
          </div>
        </div>

        <div>
          <GridSinaisVitais sinalData={sinalData} />
        </div>

        <div className="mx-auto text-center font-bold p-1 text-lg">
          <h1>Anotações da Enfermagem</h1>
        </div>

        {listaEnfermagem.map((item: any, index: number) => {
          return (
            <div key={index} className="mt-4 mb-4 border p-2">
              <label className="block font-bold mb-2">{item['label']}:</label>
              <div className="flex flex-wrap justify-between">
                {item['radio'].map((r: string, i: number) => {
                  return (
                    <label key={i}>
                      <input type="radio" name={formatarTexto(item['label'])} value={r} onChange={handleChange} className="mr-1" required />{r}
                    </label>
                  )
                })
                }
              </div>
            </div>
          )
        }
        )}

        <div className="mt-2">
          <label className="block font-bold text-center text-xl">Observações:</label>
          <textarea onChange={handleChange}
            className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name='observacoes'
            placeholder="(OPCIONAL): Digite alguma observação aqui caso tenha "
          />
        </div>

        <div className="flex items-center justify-center m-2">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
            Enviar
          </button>

        </div>

      </form>
    </div>
  )
}

export default FormSinaisVitais;