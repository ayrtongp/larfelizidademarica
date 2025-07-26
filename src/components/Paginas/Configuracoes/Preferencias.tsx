import AvatarCropper from '@/components/AvatarCropper'
import React, { useState } from 'react'
import Image from 'next/image'

const Preferencias = () => {
    const [avatar, setAvatar] = useState<string | null>(null)

    return (
        <div className="mx-auto bg-white p-6 space-y-6">

            {/* Avatar */}
            <div className="flex flex-row items-center justify-between">
                <AvatarCropper onImageCropped={(img) => setAvatar(img)} defaultImage={avatar || undefined} size={48}/>
                <div className="mt-4 flex gap-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Enviar nova</button>
                    <button className="bg-gray-200 px-4 py-2 rounded-md">Remover avatar</button>
                </div>
            </div>

            {/* <!-- Formulário --> */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Digite seu nome" className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sobrenome <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Digite seu sobrenome" className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input type="email" placeholder="exemplo@gmail.com" className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Celular <span className="text-red-500">*</span></label>
                    <div className="flex mt-1">
                        <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                            <img src="/flags/br.svg" alt="Brasil" className="w-6 h-5" />
                        </span>
                        <input type="text" placeholder="0806 123 7890" className="w-full border border-gray-300 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Gênero</label>
                    <div className="flex gap-4 mt-1">
                        <label className="inline-flex items-center">
                            <input type="radio" name="genero" className="form-radio text-blue-600" />
                            <span className="ml-2">Masculino</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input type="radio" name="genero" className="form-radio text-blue-600" />
                            <span className="ml-2">Feminino</span>
                        </label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <input type="text" placeholder="1559 000 7788 8DER" disabled className="mt-1 w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Identificação Fiscal</label>
                    <input type="text" placeholder="Digite seu NIF" className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">País do NIF</label>
                    <div className="flex mt-1">
                        <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                            🇳🇬
                        </span>
                        <select className="w-full border border-gray-300 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Nigéria</option>
                        </select>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Endereço residencial</label>
                    <textarea placeholder="Rua IB, Orogun, Ibadan" rows={2} className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
            </form>

            {/* <!-- Botão --> */}
            <div className="text-center">
                <button type="submit" className="bg-blue-700 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-800">Salvar alterações</button>
            </div>
        </div>

    )
}

export default Preferencias