import { useEffect, useState } from "react";
import { listaEnfermagem, listaIdosos } from '../utils/Listas'

function formatarTexto(texto: string) {
  // Remove acentos e converte para minúsculo
  texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Remove espaços em branco no início e fim da string
  texto = texto.trim();
  // Remove todos os espaços em branco da string
  texto = texto.replace(/\s+/g, '');
  return texto;
}

const nomesIdosos = listaIdosos.map((idoso) => {
  const nomeCompleto = idoso.nome_idoso.split(' ');
  const primeiroNome = nomeCompleto[0];
  const ultimoNome = nomeCompleto[nomeCompleto.length - 1];

  return { id: idoso.id, nome: `${primeiroNome} ${ultimoNome}` };
});

const FormSinaisVitais = () => {
  const [formData, setFormData] = useState({
    "idoso": "", "data": "", "datalancamento": Date.now(),
    "consciencia": "", "hemodinamico": "", "cardiovascular": "", "pressaoarterial": "",
    "respiratorio": "", "mucosas": "", "integridadecutanea": "", "mmss": "",
    "mmii": "", "aceitacaodadieta": "", "abdomen": "", "eliminacoes": "",
    "eliminacoesintestinais": "", "auscultapulmonar": "",

    "consciencia_obs": "", "hemodinamico_obs": "", "cardiovascular_obs": "", "pressaoarterial_obs": "",
    "respiratorio_obs": "", "mucosas_obs": "", "integridadecutanea_obs": "", "mmss_obs": "",
    "mmii_obs": "", "aceitacaodadieta_obs": "", "abdomen_obs": "", "eliminacoes_obs": "",
    "eliminacoesintestinais_obs": "", "auscultapulmonar_obs": "",
  })

  useEffect(() => {
    const selectElement = document.getElementById('idoso') as HTMLSelectElement;
    const optionValue = 'Escolha o nome do idoso';
    const selectedOption = selectElement.querySelector(`option[value="${optionValue}"]`) as HTMLOptionElement;
    selectedOption.selected = true;
  }, []);

  const handleSubmit = async (event: any) => {
    const res = await fetch("/api/SinaisVitaisController", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    const data = await res.json();
  };

  const handleChange = (e: any) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">

        <div className="mt-4 mb-4 border rounded p-2 flex flex-wrap">
          <div>
            <label className="block font-bold mb-2" htmlFor="idoso">Nome do idoso:</label>
            <select name="idoso" id="idoso" required onChange={handleChange}
              className="max-w-[250px] bg-gray-200 text-gray-700 border border-gray-400 rounded px-1 py-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
              <option disabled value="Escolha o nome do idoso">Escolha o nome do idoso</option>
              {listaIdosos.sort((a, b) => (a.nome_idoso > b.nome_idoso) ? 1 : -1).map(idoso => (
                <option key={idoso.id} value={`${idoso.nome_idoso}`}>{idoso.nome_idoso}</option>
              ))}
            </select>
          </div>

          <div className="max-w-[270px] m-2 bg-gray-200 text-gray-700 border border-gray-400 rounded px-4 py-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" >
            <label htmlFor="data" className="block font-bold mb-2">Data:</label>
            <input className="bg-gray-200" type="date" id="data" name="data" onChange={handleChange} required></input>
          </div>
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
              <div className="mt-2">
                <label className="block text-sm">Observações:</label>
                <textarea onChange={handleChange}
                  className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  name={formatarTexto(item['label']) + '_obs'}
                  placeholder="Digite as observações aqui"
                />
              </div>
            </div>
          )
        }
        )}


        <div className="flex items-center justify-center m-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit">
            Enviar
          </button>

        </div>

      </form>
    </div>
  )
}

export default FormSinaisVitais;