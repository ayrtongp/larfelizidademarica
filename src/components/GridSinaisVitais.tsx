import { notifyError, notifySuccess } from '@/utils/Functions';
import React, { useEffect, useState } from 'react'
import { FaPlus, FaTrash } from 'react-icons/fa';

const gridObj = [
  { placeholder: 'Pa MmHg', valName: 'pressaoArterial', name: "Pressão Arterial" },
]

const GridSinaisVitais = ({ sinalData }: any) => {

  const myObj = {
    pressaoArterial: '', frequenciaCardiaca: '', frequenciaRespiratoria: '',
    temperatura: '', saturacao: '', glicemiaCapilar: '', diurese: '', evacuacao: '',
  }
  const [sinais, setSinais] = useState<{
    pressaoArterial: string, frequenciaCardiaca: string, frequenciaRespiratoria: string, temperatura: string,
    saturacao: string, glicemiaCapilar: string, diurese: string, evacuacao: string,
  }[]>([]);
  const [sinaisVitais, setSinaisVitais] = useState(myObj);

  useEffect(() => {
    setSinais(sinalData.lista_sinais)
  }, [])

  const handleAddGrid = (e: any) => {
    const entryObj = {
      pressaoArterial: sinaisVitais.pressaoArterial,
      frequenciaCardiaca: sinaisVitais.frequenciaCardiaca,
      frequenciaRespiratoria: sinaisVitais.frequenciaRespiratoria,
      temperatura: sinaisVitais.temperatura,
      saturacao: sinaisVitais.saturacao,
      glicemiaCapilar: sinaisVitais.glicemiaCapilar,
      diurese: sinaisVitais.diurese,
      evacuacao: sinaisVitais.evacuacao
    }
    if (Object.values(entryObj).some(val => val == "" || val === null || val === undefined)) {
      notifyError("Todos os campos devem ser preenchidos para adicionar uma linha.")
    } else {
      const newSinal = [...sinais, entryObj];
      setSinais(newSinal);
      setSinaisVitais(myObj)
    }
  };

  const handleDeleteGrid = (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newSinal = [...sinais];
    newSinal.splice(index, 1);
    setSinais(newSinal);
  };

  const handleSinais = (e: any) => {
    setSinaisVitais((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      const listaSinais = { lista_sinais: sinais }
      const res = await fetch(`/api/Controller/SinaisVitaisController?id=${sinalData._id}`, {
        method: 'PUT',
        body: JSON.stringify(listaSinais),
      });
      if (res.ok) {
        const data = await res.json();
        notifySuccess('Sinal(is) Adicionado(s) com sucesso!')
      } else {
        notifyError('Houve um problema ao adicionar a(s) linha(s)')
      }
    } catch (error) {
      notifyError('Erro desconhecido, contate o administrador')
      console.error(error);
    }
  };

  return (
    <div>
      <div> {/* GRID CONTATO */}
        <div className="mt-4 mb-4 border text-center p-2 mx-auto">
          <h2 className="my-3 text-center font-bold">Sinais Vitais</h2>
          <div className="grid grid-cols-3 gap-2"> {/* linha para cadastro */}
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="pressaoArterial" type="text" placeholder="Pa MmHg" value={sinaisVitais.pressaoArterial} onChange={handleSinais} />
            </div>
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="frequenciaCardiaca" type="text" placeholder="FC bpm" value={sinaisVitais.frequenciaCardiaca} onChange={handleSinais} />
            </div>
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="frequenciaRespiratoria" type="text" placeholder="FR irpm" value={sinaisVitais.frequenciaRespiratoria} onChange={handleSinais} />
            </div>
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="temperatura" type="text" placeholder="TAX ºC" value={sinaisVitais.temperatura} onChange={handleSinais} />
            </div>
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="saturacao" type="text" placeholder="SPO2 %" value={sinaisVitais.saturacao} onChange={handleSinais} />
            </div>
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="glicemiaCapilar" type="text" placeholder="HGT" value={sinaisVitais.glicemiaCapilar} onChange={handleSinais} />
            </div>
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="diurese" type="text" placeholder="Diurese" value={sinaisVitais.diurese} onChange={handleSinais} />
            </div>
            <div className="">
              <input className="border border-gray-500 rounded-md p-1 w-full" name="evacuacao" type="text" placeholder="Evacuações" value={sinaisVitais.evacuacao} onChange={handleSinais} />
            </div>
            <div className=" text-center">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleAddGrid} >
                <FaPlus />
              </button>
            </div>
          </div> {/* linha para cadastro */}

          <div className="mt-4 text-xs overflow-x-scroll whitespace-nowrap"> {/* sinais cadastrados */}
            {sinais.map((sinal, index) => (
              <div key={index} className=" max-w-md  mt-2">
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" onClick={handleDeleteGrid(index)} >
                  <FaTrash />
                </button>
                <div className='inline-block'>
                  <div className="px-4 py-2">Pa MmHG</div>
                  <div>{sinal.pressaoArterial}</div>
                </div>
                <div className='inline-block'>
                  <div className="px-4 py-2">FC bpm</div>
                  <div>{sinal.frequenciaCardiaca}</div>
                </div>
                <div className='inline-block'>
                  <div className="px-4 py-2">FR irpm</div>
                  <div>{sinal.frequenciaRespiratoria}</div>
                </div>
                <div className='inline-block'>
                  <div className="px-4 py-2">TAX ºC</div>
                  <div>{sinal.temperatura}</div>
                </div>
                <div className='inline-block'>
                  <div className="px-4 py-2">SPO2 %</div>
                  <div>{sinal.saturacao}</div>
                </div>
                <div className='inline-block'>
                  <div className="px-4 py-2">HGT</div>
                  <div>{sinal.glicemiaCapilar}</div>
                </div>
                <div className='inline-block'>
                  <div className="px-4 py-2">Diurese</div>
                  <div>{sinal.diurese}</div>
                </div>
                <div className='inline-block'>
                  <div className="px-4 py-2">Evacuação</div>
                  <div>{sinal.evacuacao}</div>
                </div>
                <hr className="my-2" />
              </div>
            ))}
          </div> {/* sinais cadastrados */}

        </div> {/* GRID CONTATO */}

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleSubmit} >
          Salvar sinais
        </button>

      </div>
    </div>
  )
}

export default GridSinaisVitais
