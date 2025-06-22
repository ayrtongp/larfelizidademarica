import { getGridSinaisVitaisByID, notifyError, notifySuccess } from '@/utils/Functions';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { FaPlus, FaTrash } from 'react-icons/fa';

interface Sinais {
  diurese: string,
  evacuacao: string,
  frequenciaCardiaca: string,
  frequenciaRespiratoria: string,
  glicemiaCapilar: string,
  pressaoArterial: string,
  saturacao: string,
  temperatura: string,
}

const GridSinaisVitais = ({ sinalData }: any) => {

  // ##########################################
  // ########## DECLARATIONS ##########
  // ##########################################

  const gridInfo = {
    gridName: "Sinais Vitais",
    textAddButton: "Adicionar Linha",
    textSubmitGrid: "Salvar Alterações",
  }

  const camposLinhaGrid = {
    pressaoArterial: '', frequenciaCardiaca: '', frequenciaRespiratoria: '',
    temperatura: '', saturacao: '', glicemiaCapilar: '', diurese: '', evacuacao: '',
  }

  const router = useRouter();
  const { editId } = router.query
  const [listaSinais, setListaSinais] = useState<Sinais[]>([])
  const [linhaSinais, setLinhasSinais] = useState(camposLinhaGrid);

  const gridFields = [
    { name: "pressaoArterial", type: "text", placeholder: "Pa MmHg", value: linhaSinais.pressaoArterial, },
    { name: "frequenciaCardiaca", type: "text", placeholder: "FC bpm", value: linhaSinais.frequenciaCardiaca, },
    { name: "frequenciaRespiratoria", type: "text", placeholder: "FR irpm", value: linhaSinais.frequenciaRespiratoria, },
    { name: "temperatura", type: "text", placeholder: "TAX ºC", value: linhaSinais.temperatura, },
    { name: "saturacao", type: "text", placeholder: "SPO2 %", value: linhaSinais.saturacao, },
    { name: "glicemiaCapilar", type: "text", placeholder: "HGT", value: linhaSinais.glicemiaCapilar, },
    { name: "diurese", type: "text", placeholder: "Diurese", value: linhaSinais.diurese, },
    { name: "evacuacao", type: "text", placeholder: "Evacuações", value: linhaSinais.evacuacao, },
  ]

  // ##########################################
  // ########## FUNCTIONS ##########
  // ##########################################

  async function fetchData() {
    if (editId) {
      const lista_sinais = await getGridSinaisVitaisByID(editId)
      setListaSinais(lista_sinais)
    }
  }

  // ##########################################
  // ########## USEEFFECT ##########
  // ##########################################

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!editId && sinalData != "" && sinalData != undefined && sinalData != null) {
      handleSubmit()
    }
  }, [sinalData])

  // ##########################################
  // ########## HANDLERS ##########
  // ##########################################

  const handleAddGrid = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    if (Object.values(linhaSinais).some(val => val == "" || val === null || val === undefined)) {
      notifyError("Todos os campos devem ser preenchidos para adicionar uma linha.")
    } else {
      const newSinal = [...listaSinais, linhaSinais];
      setListaSinais(newSinal);
      setLinhasSinais(camposLinhaGrid)
    }
  };

  const handleDeleteGrid = (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newSinal = [...listaSinais];
    newSinal.splice(index, 1);
    setListaSinais(newSinal);
  };

  const handleSinais = (e: any) => {
    setLinhasSinais((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      const teste = await sinalData
      const lista_sinais = { lista_sinais: listaSinais }
      const res = await fetch(`/api/Controller/SinaisVitaisController?id=${teste.id}`, {
        method: 'PUT',
        body: JSON.stringify(lista_sinais),
      });
      if (res.ok) {
        notifySuccess('Sinal(is) Adicionado(s) com sucesso!')
      } else {
        notifyError('Houve um problema ao adicionar a(s) linha(s)')
      }
    } catch (error) {
      notifyError('Erro desconhecido, contate o administrador')
      console.error(error);
    }
  };

  // ##########################################
  // ########## RETURN ##########
  // ##########################################

  return (
    <div className='w-[280px] sm:w-full'> {/* GRID CONTATO */}
      <div className="mt-4 mb-4 border text-center p-2 mx-auto">
        <h2 className="my-3 text-center font-bold">{gridInfo.gridName}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"> {/* linha para cadastro */}
          {gridFields.map((field, index) => {
            return (
              <div key={index} className="">
                <input
                  className="border border-gray-500 rounded-md p-1 w-full"
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={handleSinais} />
              </div>
            )
          })}
        </div>
        <div className="text-center">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold mt-2 py-1 px-2 rounded" onClick={handleAddGrid} >
            {gridInfo.textAddButton}
          </button>
        </div> {/* linha para cadastro */}

        <div className="mt-4 text-xs overflow-x-scroll whitespace-nowrap"> {/* listaSinais cadastrados */}
          {listaSinais.map((sinal, index) => (
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
        </div> {/* listaSinais cadastrados */}

      </div> {/* GRID CONTATO */}

      {editId &&
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded" onClick={handleSubmit} >
          {gridInfo.textSubmitGrid}
        </button>
      }

    </div>
  )
}

export default GridSinaisVitais
