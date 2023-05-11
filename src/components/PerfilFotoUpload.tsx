import { notifySuccess } from '@/utils/Functions';
import { getUserID, updateProfile } from '@/utils/Login';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaEye } from "react-icons/fa";

const PerfilFotoUpload = () => {
  const [previewImage, setPreviewImage] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState<File | undefined>();
  const [base64, setBase64] = useState('');
  const [dataPass, setDataPass] = useState({ oldPass: '', newPass: '', repPass: '' })
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      if (reader.result) {
        const base64Image = reader.result.toString();
        setBase64(base64Image)
        let userInfo = localStorage.getItem('userInfo');
        if (userInfo && userInfo !== null) {
          let teste = JSON.parse(userInfo)
          if (teste) {
            teste.fotoPerfil = base64Image;
            localStorage.setItem('userInfo', JSON.stringify(teste));
          }
        }

      }
    }
  };

  const handleChange = (event: any) => {
    setDataPass((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value
    }));
  }


  const handleUpload = async () => {
    try {
      const formData = { foto_base64: base64 }
      const res = await fetch(`/api/Controller/UsuarioController?tipo=alteraFoto&id=${getUserID()}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        const newPic = document.getElementById('foto_perfil') as HTMLImageElement
        newPic ? newPic.src = base64 : ''
        notifySuccess('Foto de Perfil Alterada!')
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangePass = async () => {
    try {
      const res = await fetch(`/api/Controller/UsuarioController?tipo=alteraSenha&id=${getUserID()}`, {
        method: 'PUT',
        body: JSON.stringify(dataPass),
      });
      if (res.ok) {
        const data = await res.json();
        notifySuccess('Senha Alterada!')
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='flex items-center flex-wrap justify-center'>
      <div className="m-2 p-2 flex items-center justify-center flex-col border shadow-md border-black">
        <div className='text-center m-2 font-bold'>
          <h2>Alterar Foto</h2>
        </div>
        <div className="w-48 h-48 rounded-full overflow-hidden border border-zinc-950 flex items-center justify-center">
          {previewImage ? (
            <img className="object-cover w-full h-full" src={previewImage} alt="Profile picture preview" />
          ) : (
            <span>Sem foto</span>
          )}
        </div>
        <div className='mt-3'>
          <label htmlFor="profile-picture-input" className="p-2 bg-white rounded-full cursor-pointer shadow-lg"        >
            Selcionar Arquivo
          </label>
          <input id="profile-picture-input" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
        </div>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
          onClick={handleUpload} disabled={!selectedImage}>
          Salvar
        </button>
      </div>
      <div className="m-2 flex items-center justify-center flex-col border shadow-md border-black">
        <div className='w-full text-center m-2 font-bold relative'>
          <h2>Alterar Senha</h2>
          <button onClick={togglePasswordVisibility} className="text-red-800 absolute top-1/2 right-5 transform -translate-y-1/2 focus:outline-none">
            <FaEye />
          </button>
        </div>
        <div className='p-2'>
          <div className='mb-4'>
            <label className='block text-gray-600 text-sm font-bold mb-1' htmlFor="oldPass">Senha antiga:</label>
            <input onChange={handleChange} className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' name='oldPass' type={showPassword ? 'text' : 'password'} />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-600 text-sm font-bold mb-1' htmlFor="newPass">Nova senha:</label>
            <input onChange={handleChange} className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' name='newPass' type={showPassword ? 'text' : 'password'} />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-600 text-sm font-bold mb-1' htmlFor="repPass">Confirme a senha:</label>
            <input onChange={handleChange} className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' name='repPass' type={showPassword ? 'text' : 'password'} />
          </div>
          <button className="text-center mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors" onClick={handleChangePass}>
            Trocar Senha
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerfilFotoUpload;
