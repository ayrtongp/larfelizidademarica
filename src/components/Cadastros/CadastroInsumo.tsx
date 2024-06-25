import { notifyError, notifySuccess } from "@/utils/Functions";
import SubmitButtonM2 from "../Formularios/SubmitButtonM2";
import TextInputM2 from "../Formularios/TextInputM2";
import { useState } from "react";
import SelectInputM2 from "../Formularios/SelectInputM2";

interface Categoria {
  option: string;
  value: string;
}

interface Props {
  listaDeCategorias: Categoria[];
}
const CadastroInsumo: React.FC<Props> = ({ listaDeCategorias }) => {

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_insumo: "",
    unidade: "",
    cod_categoria: "",
    descricao: ""
  });

  const handleChange = (e: any) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };


  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      setLoading(true)

      const res = await fetch(`/api/Controller/Insumos?type=new`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        notifySuccess('Adicionado com sucesso!')
        setLoading(false)
        setFormData({ nome_insumo: "", unidade: "", cod_categoria: "", descricao: "" })
      } else {
        notifyError('Houve um problema ao adicionar o registro')
        setLoading(false)
      }

    } catch (error) {
      setLoading(false)
      console.error(error)
    }

  }

  return (
    <div className='grid grid-cols-12 gap-2 border rounded-md shadow-xl p-2 bg-white w-[95%] my-2'>
      <h1 className='font-bold text-xl mx-auto col-span-full'>Cadastro de Insumo</h1>
      <div className='col-span-full sm:col-span-4'>
        <TextInputM2 label='Nome do Insumo' name='nome_insumo' value={formData.nome_insumo} disabled={false} onChange={handleChange} />
      </div>
      <div className='col-span-full sm:col-span-4'>
        <TextInputM2 label='Unidade de Medida' name='unidade' value={formData.unidade} disabled={false} onChange={handleChange} />
      </div>
      <div className='col-span-full sm:col-span-4'>
        <SelectInputM2 options={listaDeCategorias} label='Nome Categoria' name='cod_categoria' value={formData.cod_categoria} disabled={false} onChange={handleChange} />
      </div>
      <div className='col-span-full sm:col-span-4'>
        <TextInputM2 label='Descrição' name='descricao' value={formData.descricao} disabled={false} onChange={handleChange} />
      </div>
      <div className='col-span-full'>
        <SubmitButtonM2 label='Salvar Insumo' onClick={handleSubmit} />
      </div>
    </div>
  )
}

export default CadastroInsumo;