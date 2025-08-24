import AvatarCropper from '@/components/AvatarCropper'
import React, { useEffect, useState } from 'react'
import TextInputM2 from '@/components/Formularios/TextInputM2';
import RadioButtonM2 from '@/components/Formularios/RadioButtonM2';
import LoadingSpinner from '@/components/LoadingSpinner';
import TabelaGenerica from '@/components/TabelaGenerica';

interface Props {
    userInfo: any;
}

const Preferencias = ({ userInfo }: Props) => {

    const INITIALSTATE = {
        nome: userInfo.nome || '',
        sobrenome: userInfo.sobrenome || '',
        email: userInfo.email || '',
        celular: userInfo.celular || '',
        genero: userInfo.genero || '',
        username: userInfo.username || '',
        registro: userInfo.registro || '',
        funcao: userInfo.funcao || '',
        fotoPerfil: userInfo.foto_base64 || '',
        grupos: userInfo.grupos || [],
    }

    // ******************************************************
    // ******************************************************
    // STATE
    // ******************************************************
    // ******************************************************

    const [avatar, setAvatar] = useState<string | null>(userInfo.fotoPerfil || null)
    const [formData, setFormData] = useState(INITIALSTATE)
    console.log(userInfo)
    console.log(INITIALSTATE)

    // ******************************************************
    // ******************************************************
    // USEEFFECT
    // ******************************************************
    // ******************************************************

    useEffect(() => {
        setFormData(INITIALSTATE)
    }, [userInfo])

    // ******************************************************
    // ******************************************************
    // HANDLERS
    // ******************************************************
    // ******************************************************

    const handleChange = (e: any) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    };

    // ******************************************************
    // ******************************************************
    // RETURN
    // ******************************************************
    // ******************************************************

    if (!userInfo) {
        return <LoadingSpinner />
    }

    else {
        return (
            <div className="mx-auto bg-white p-6 space-y-6">

                {/* Avatar */}
                <div className="flex flex-row items-center justify-center md:justify-between">
                    <AvatarCropper defaultImage={formData.fotoPerfil} onImageCropped={(croppedBase64) => { }} size={48} />
                    {/* <div className="mt-4 flex gap-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Enviar nova</button>
                    <button className="bg-gray-200 px-4 py-2 rounded-md">Remover avatar</button>
                    </div> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextInputM2 label='Nome' name='nome' onChange={handleChange} value={formData.nome} disabled />
                    <TextInputM2 label='Sobrenome' name='sobrenome' onChange={handleChange} value={formData.sobrenome} disabled />
                    <TextInputM2 label='Função' name='funcao' onChange={handleChange} value={formData.funcao} disabled />
                    <TextInputM2 label='Núm. Registro' name='registro' onChange={handleChange} value={formData.registro} disabled />
                    <TextInputM2 label='Email' name='email' onChange={handleChange} value={formData.email} disabled />
                    <TextInputM2 label='Celular' name='celular' onChange={handleChange} value={formData.celular} disabled />
                    <div className='space-y-2'>
                        <label className="block text-gray-700 text-left pl-1 text-sm font-bold " htmlFor="genero">Gênero</label>
                        <RadioButtonM2 label="Masculino" name="genero" value="masculino" checked={formData.genero === "masculino"} onChange={handleChange} disabled />
                        <RadioButtonM2 label="Feminino" name="genero" value="feminino" checked={formData.genero === "feminino"} onChange={handleChange} disabled />
                    </div>
                    <div className='col-span-full border p-2 mt-3'>
                        <h1 className='font-bold mb-4'>Meus Grupos</h1>
                        <TabelaGenerica rowsPerPage={20} dados={formData.grupos} colunas={[
                            { key: 'cod_grupo', label: 'Código' },
                            { key: 'nome_grupo', label: 'Nome' },
                        ]} />
                    </div>
                </div >

                {/* <!-- Botão --> */}
                {/* < div className="text-center" >
                <button type="submit" className="bg-blue-700 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-800">Salvar alterações</button>
                </div > */}
            </div >

        )
    }
}

export default Preferencias