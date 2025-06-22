import { MouseEventHandler, useState } from "react";
import { FaTrash, FaPlus } from 'react-icons/fa'

interface FormCadastroIdoso {
  responsavel: string;
  contato: string;
}

const FormCadastroIdoso = () => {
  const [contatos, setContatos] = useState<{ responsavel: string; contato: string }[]>([]);
  const [responsavel, setResponsavel] = useState("");
  const [contato, setContato] = useState("");

  const [formData, setFormData] = useState({
    nomeIdoso: '', dataNascimento: '', dataEntrada: '', contrato: '', grauDependencia: '', observacoesIdoso: '',
  })

  const handleAddContato = (e: any) => {
    e.preventDefault()
    const newContatos = [...contatos, { responsavel, contato }];
    setContatos(newContatos);
    setResponsavel("");
    setContato("");
  };

  const handleDeleteContato = (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newContatos = [...contatos];
    newContatos.splice(index, 1);
    setContatos(newContatos);
  };

  const handleSubmit = async (event: any) => {
    const obj = {
      nome: formData.nomeIdoso,
      dataNascimento: formData.dataNascimento,
      dataEntrada: formData.dataEntrada,
      contrato: formData.contrato,
      grauDependencia: formData.grauDependencia,
      observacoesIdoso: formData.observacoesIdoso,
      status: 'ativo',
      grid_responsaveis: contatos,
    }
    const res = await fetch("/api/IdosoController", {
      method: "POST",
      body: JSON.stringify(obj),
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

        <div className="mt-4 mb-4 border p-2">
          <label className="block font-bold mb-2">Nome Completo do Idoso:</label>
          <div className="">
            <label htmlFor="nomeIdoso">
              <input type="text" name='nomeIdoso' onChange={handleChange} className="w-full border-gray-400 border-2 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-gray-400" required />
            </label>
          </div>
        </div>

        <div className="mt-4 mb-4 border rounded p-2 flex flex-wrap">
          <div>
            <div className="max-w-[270px] m-2 bg-gray-200 text-gray-700 border border-gray-400 rounded px-4 py-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" >
              <label htmlFor="dataNascimento" className="block font-bold mb-2">Data de Nascimento:</label>
              <input className="bg-gray-200" type="date" onChange={handleChange} id="dataNascimento" name="dataNascimento" required></input>
            </div> {/* div botão de data */}

            <div className="max-w-[270px] m-2 bg-gray-200 text-gray-700 border border-gray-400 rounded px-4 py-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" >
              <label htmlFor="dataEntrada" className="block font-bold mb-2">Data de Entrada:</label>
              <input className="bg-gray-200" type="date" onChange={handleChange} id="dataEntrada" name="dataEntrada" required></input>
            </div> {/* div botão de data */}
          </div>
        </div>

        <div className="mt-4 mb-4 border p-2">
          <label className="block font-bold mb-2">Contrato:</label>
          <div className="flex flex-wrap justify-between">
            <label htmlFor='residente'>
              <input type="radio" name='contrato' value='residente' onChange={handleChange} className="mr-1" required />Residente
            </label>
            <label htmlFor="temporario">
              <input type="radio" name='contrato' value='temporario' onChange={handleChange} className="mr-1" required />Temporário
            </label>
          </div>
        </div>

        <div className="mt-4 mb-4 border p-2">
          <label className="block font-bold mb-2">Grau de Dependência:</label>
          <div className="flex flex-wrap justify-between">
            <label htmlFor='grauDependencia'>
              <input type="radio" name='grauDependencia' value='grau1' onChange={handleChange} className="mr-1" required />Grau I
            </label>
            <label htmlFor='grau2'>
              <input type="radio" name='grauDependencia' value='grau2' onChange={handleChange} className="mr-1" required />Grau II
            </label>
            <label htmlFor='grau3'>
              <input type="radio" name='grauDependencia' value='grau3' onChange={handleChange} className="mr-1" required />Grau III
            </label>
          </div>
        </div>

        <div className="mt-4 mb-4 border p-2">
          <div className="mt-2">
            <label className="block text-sm">Observações:</label>
            <textarea onChange={handleChange}
              className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              name='observacoesIdoso'
              placeholder="Digite as observações do idoso aqui"
            />
          </div> {/* div observações */}
        </div>

        <div> {/* GRID CONTATO */}
          <div className="mt-4 mb-4 border p-2">
            <h2 className="my-3 text-center font-bold">Responsáveis</h2>

            <div className="grid grid-cols-8 gap-4"> {/* linha para cadastro */}
              <div className="col-span-4">
                <input className="border border-gray-500 rounded-md p-1 w-full"
                  type="text" placeholder="Responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              </div>
              <div className="col-span-3">
                <input className="border border-gray-500 rounded-md p-1 w-full" type="text" placeholder="Contato" value={contato} onChange={(e) => setContato(e.target.value)} />
              </div>
              <div className="col-span-1 text-center">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleAddContato} >
                  <FaPlus />
                </button>
              </div>
            </div> {/* linha para cadastro */}

            <div className="mt-4"> {/* contatos cadastrados */}
              {contatos.map((contato, index) => (
                <div key={index} className="text-xs flex flex-wrap mt-2">
                  <div className="w-[50%]">
                    <p>Resp.: {contato.responsavel}</p>
                  </div>
                  <div className="w-[45%]">
                    <p>Ctt: {contato.contato}</p>
                  </div>
                  <div className="w-[5%]">
                    <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" onClick={handleDeleteContato(index)} >
                      <FaTrash />
                    </button>
                  </div>
                  <hr className="my-2" />
                </div>
              ))}
            </div> {/* contatos cadastrados */}

          </div> {/* GRID CONTATO */}
        </div>

        <div className="flex items-center justify-center m-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit">
            Cadastrar Idosos
          </button>

        </div>

      </form>
    </div>
  )
}

export default FormCadastroIdoso;