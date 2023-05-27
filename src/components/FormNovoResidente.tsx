import { notifyError, notifySuccess } from '@/utils/Functions';
import React, { useState } from 'react'

const FormNovoResidente = () => {

  const [formData, setFormData] = useState({
    apelido: "",
    cpf: "",
    data_entrada: "",
    data_nascimento: "",
    genero: "",
    informacoes: "Nenhuma observação.",
    nome: "",
  })

  const currentDate = new Date().toISOString().split('T')[0];

  const handleChange = (e: any) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleCPFChange = (event: any) => {
    const inputValue = event.target.value;
    const cleanedValue = inputValue.replace(/\D/g, ''); // Remove non-digit characters
    const formattedValue = formatCPF(cleanedValue); // Format the CPF
    setFormData((prevState) => ({
      ...prevState,
      ["cpf"]: formattedValue
    }));
  };

  const formatCPF = (value: any) => {
    if (value.length <= 3) { return value; }
    if (value.length <= 6) { return `${value.slice(0, 3)}.${value.slice(3)}`; }
    if (value.length <= 9) { return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`; }
    return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const hasEmptyValue = Object.values(formData).includes('');
    if (!hasEmptyValue) {
      const res = await fetch("/api/Controller/ResidentesController?type=new", { method: "POST", body: JSON.stringify(formData), });
      const data = await res.json();
      if (res.ok) {
        notifySuccess("Residente cadastrado com sucesso!")
      } else {
        notifyError(data.message)
      }
    } else {
      notifyError("Preencha todos os campos do cadastro!")
    }
  };

  return (
    <div className='col-span-12'>
      <form onSubmit={handleSubmit} className='grid grid-cols-12 gap-3'>

        <div className='col-span-12 sm:col-span-6'>
          <label className="block text-sm font-bold mb-1" htmlFor="nome">
            Nome do Residente
          </label>
          <input name="nome" type="text" onChange={handleChange}
            className="border rounded py-2 px-3 shadow-sm border-slate-200 leading-5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>

        <div className='col-span-12 sm:col-span-3'>
          <label className="block text-sm font-bold mb-1" htmlFor="apelido">Apelido</label>
          <input name="apelido" onChange={handleChange} type="text"
            className="border rounded py-2 px-3 shadow-sm border-slate-200 leading-5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>

        <div className='col-span-12 sm:col-span-3'>
          <label className="block text-sm font-bold mb-1" htmlFor="genero">Gênero</label>
          <select name='genero' value={formData.genero} onChange={handleChange}
            className='border rounded py-2 px-3 shadow-sm border-slate-200 leading-5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"'>
            <option disabled value="">Select gender</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
        </div>


        <div className='col-span-12 sm:col-span-3'>
          <label className="block text-sm font-bold mb-1" htmlFor="data_nascimento">Data de Nascimento</label>
          <input name="data_nascimento" maxLength={10} onChange={handleChange} type="date" min={"1900-01-01"} max={"1999-01-01"}
            className="border rounded py-2 px-3 shadow-sm border-slate-200 leading-5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>

        <div className='col-span-12 sm:col-span-3'>
          <label className="block text-sm font-bold mb-1" htmlFor="data_entrada">Data de Entrada</label>
          <input name="data_entrada" maxLength={10} onChange={handleChange} type="date" min={"1900-01-01"} max={currentDate}
            className="border rounded py-2 px-3 shadow-sm border-slate-200 leading-5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>

        <div className='col-span-12 sm:col-span-3'>
          <label className="block text-sm font-bold mb-1" htmlFor="data_entrada">CPF</label>
          <input name="data_entrada" maxLength={14} pattern="\d{3}\.\d{3}\.\d{3}-\d{2}" value={formData.cpf} onChange={handleCPFChange}
            className="border rounded py-2 px-3 shadow-sm border-slate-200 leading-5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400" type="text" />
        </div>

        <div className='col-span-12 sm:col-span-12'>
          <label className="block text-sm font-bold mb-1" htmlFor="informacoes">Informações</label>
          <textarea name="informacoes" onChange={handleChange} value={formData.informacoes}
            className="border rounded py-2 px-3 shadow-sm border-slate-200 leading-5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>

        <div className='col-span-12 flex justify-center mt-4'>
          <button type="submit"
            className='bg-indigo-500 text-white px-3 py-2 rounded text-sm font-bold shadow-sm hover:bg-indigo-800 transition'>Cadastrar Residente</button>
        </div>
      </form>
    </div>
  )
}

export default FormNovoResidente
