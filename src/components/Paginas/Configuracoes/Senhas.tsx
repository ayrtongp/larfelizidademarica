import { notifyError, notifySuccess } from '@/utils/Functions';
import { getUserID } from '@/utils/Login';
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Senhas = () => {
    const [dataPass, setDataPass] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmaSenha: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDataPass((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleChangePass = async () => {
        if (!dataPass.novaSenha || !dataPass.confirmaSenha) {
            return alert('Preencha todos os campos');
        }

        if (dataPass.novaSenha !== dataPass.confirmaSenha) {
            return alert('As senhas não coincidem');
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/Controller/Usuario?tipo=alteraSenha&id=${getUserID()}`, {
                method: 'PUT',
                body: JSON.stringify({
                    currentPass: dataPass.senhaAtual,
                    newPass: dataPass.novaSenha,
                    repPass: dataPass.confirmaSenha
                }),

            });

            const data = await res.json();
            if (!res.ok) {
                notifyError(data.message || 'Erro ao alterar senha');
            }
            if (res.ok) {
                notifySuccess('Senha Alterada!');
                setDataPass({ senhaAtual: '', novaSenha: '', confirmaSenha: '' });
            }
        } catch (error) {
            console.error(error);
            alert('Erro inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow-md space-y-4">
            <h2 className="text-lg font-bold text-gray-700">Alterar Senha</h2>

            {/* Senha Atual */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha Atual</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="senhaAtual"
                        value={dataPass.senhaAtual}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-blue-200"
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-2 flex items-center text-gray-500"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
            </div>

            {/* Nova Senha */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nova Senha</label>
                <input
                    type={showPassword ? 'text' : 'password'}
                    name="novaSenha"
                    value={dataPass.novaSenha}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                />
            </div>

            {/* Confirmar Senha */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar Senha</label>
                <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmaSenha"
                    value={dataPass.confirmaSenha}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                />
            </div>

            {/* Botão */}
            <button
                onClick={handleChangePass}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
                {loading ? 'Salvando...' : 'Alterar Senha'}
            </button>
        </div>
    );
};

export default Senhas;
