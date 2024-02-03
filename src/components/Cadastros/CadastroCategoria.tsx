import { notifyError, notifySuccess } from "@/utils/Functions";
import SubmitButtonM2 from "../Formularios/SubmitButtonM2";
import TextInputM2 from "../Formularios/TextInputM2";
import { useState } from "react";

const CadastroCategoria = () => {

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ cod_categoria: "", nome_categoria: "", descricao: "" });

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

      const res = await fetch(`/api/Controller/Categorias?type=new`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ cod_categoria: "", nome_categoria: "", descricao: "" })
        notifySuccess('Adicionado com sucesso!')
        setLoading(false)
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
    <div className='grid grid-cols-12 gap-2 border rounded-md shadow-xl p-2 bg-white'>
      <h1 className='font-bold text-xl mx-auto col-span-full'>Cadastro de Categoria</h1>
      <div className='col-span-full sm:col-span-4'>
        <TextInputM2 label='Código Categoria' name='cod_categoria' value={formData.cod_categoria} disabled={false} onChange={handleChange} />
      </div>
      <div className='col-span-full sm:col-span-4'>
        <TextInputM2 label='Nome Categoria' name='nome_categoria' value={formData.nome_categoria} disabled={false} onChange={handleChange} />
      </div>
      <div className='col-span-full sm:col-span-4'>
        <TextInputM2 label='Descrição' name='descricao' value={formData.descricao} disabled={false} onChange={handleChange} />
      </div>
      <div className='col-span-full'>
        <SubmitButtonM2 label='Salvar Categoria' onClick={handleSubmit} />
      </div>
    </div>
  )
}

export default CadastroCategoria;