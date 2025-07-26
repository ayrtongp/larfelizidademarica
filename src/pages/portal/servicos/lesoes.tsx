import { Residentes_GET_getAllActive } from '@/actions/Residentes'
import Button_M3 from '@/components/Formularios/Button_M3'
import Date_M3 from '@/components/Formularios/Date_M3'
import Number_M3 from '@/components/Formularios/Number_M3'
import RichReadOnly_M3 from '@/components/Formularios/RichReadOnly_M3'
import RichText_M3 from '@/components/Formularios/RichTextArea_M3'
import Select_M3 from '@/components/Formularios/Select_M3'
import Textarea_M3 from '@/components/Formularios/TextArea_M3'
import TextInputM2 from '@/components/Formularios/TextInputM2'
import HumanBodyImage from '@/components/HumanBodyImage'
import Modalpadrao from '@/components/ModalPadrao'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useLoadingOverlay } from '@/context/LoadingOverlayContext'
import { Lesao, FERIDA_TYPE_OPTIONS, validarLesao, VISTA_TYPE_OPTIONS, LESAO_STATUS_OPTIONS, validarUpdateStatus, Comentario } from '@/models/lesoes.model'
import { sendMessage } from '@/pages/api/WhatsApp'
import { createLesao, getLesoes, updateLesao } from '@/services/lesoes.svc'
import { formatDateBR, formatDateBRHora, getCurrentDateTime, getUserDetails, isComentarioVazio, notifyError, notifySuccess, stripHtml } from '@/utils/Functions'
import { getUserID } from '@/utils/Login'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { FaPlusCircle, FaTable } from 'react-icons/fa'

const Index = () => {

    // *************************
    // *************************
    // PRIMAL
    // *************************
    // *************************



    const initialState: Lesao = {
        _id: '',
        vista: 'frente',
        regiaoCorpo: '',
        dataLesao: '',
        descricao: '',
        userId: '',
        userName: '',
        tipoLesao: '',
        xPos: 0,
        yPos: 0,
        riscoInfeccao: 0,
        nivelDor: 0,
        status: 'iniciada',
        comentarios: [],
        createdAt: getCurrentDateTime(),
        updatedAt: getCurrentDateTime(),
    };

    // *************************
    // *************************
    // STATES
    // *************************
    // *************************

    const [isModalOpen, setisModalOpen] = useState<boolean>(false);
    const [modalType, setmodalType] = useState<string>(``);
    const [type, setType] = useState<string>('')
    const [formData, setFormData] = useState<Lesao>(initialState);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [listaResidentes, setListaResidentes] = useState<any[]>([]);
    const [listaLesoes, setListaLesoes] = useState<Lesao[]>([]);
    const [selectedLesao, setSelectedLesao] = useState<Lesao | null>(null);
    const [novoComentario, setNovoComentario] = useState<string>('');
    const [updateStatusLesao, setUpdateStatusLesao] = useState<any>({ status: '', lesaoId: '', updatedAt: '' });
    const { showLoading, hideLoading } = useLoadingOverlay();

    // *************************
    // *************************
    // HANDLERS
    // *************************
    // *************************

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;

        setFormData((prevData: any) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'userId') {
            const residente = listaResidentes.find(r => r._id === value);
            setFormData((prevData: any) => ({
                ...prevData,
                userId: value,
                userName: residente ? residente.nome : ''
            }));
        } else {
            setFormData((prevData: any) => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const handleBodyClick = (data: any) => {
        setFormData((prevData: any) => ({
            ...prevData,
            regiaoCorpo: data.bodyPart,
            xPos: data.x,
            yPos: data.y,
        }));
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        showLoading();
        const { valido, erros } = validarLesao(formData);
        if (!valido) {
            setFormErrors([]);
            setFormErrors(erros);
            notifyError('Erros de validação encontrados:');
            hideLoading();
            return;
        }
        else {
            setFormData(initialState); // Reseta o formulário após salvar
            setFormErrors([]); // Limpa os erros
            const response = await createLesao(formData);
            if (!response.success) {
                notifyError('Erro ao salvar lesão.');
                hideLoading();
                return;
            }
            else {
                notifySuccess('Lesão salva com sucesso!');
                const nomeIdoso = listaResidentes.find(residente => residente._id === formData.userId);
                const mensagem = `*Nova Lesão Cadastrada* \n\nIdoso: ${nomeIdoso.apelido} \nTipo de Lesão: ${formData.tipoLesao} \nData da Lesão: ${formatDateBR(formData.dataLesao)} \n\nlarfelizidade.com.br/portal/servicos/lesoes`
                // const wppMessage = await sendMessage('120363319721988791@g.us', mensagem)
                const wppTo = process.env.NEXT_PUBLIC_WPP_GRUPO_PRINCIPAL as string;
                const wppMessage = await sendMessage(wppTo, mensagem)
                hideLoading();
            }
        }
    };

    const handleClear = () => {
        setFormData(initialState);
        setFormErrors([]);
    };

    const handleRowClick = (lesao: Lesao) => {
        setSelectedLesao(lesao);
        setisModalOpen(true);
        setUpdateStatusLesao((prev: any) => ({
            ...prev,
            status: lesao.status,
        }));
    };

    const handleChangeStatus = (e: any) => {
        if (!selectedLesao) return;
        setUpdateStatusLesao({ status: e.target.value, lesaoId: selectedLesao._id, updatedAt: getCurrentDateTime() });
    }

    const handleUpdateStatus = async () => {
        if (!selectedLesao || !updateStatusLesao.status || !updateStatusLesao.lesaoId) return;
        showLoading();
        try {
            const { valido, erros } = validarUpdateStatus(updateStatusLesao.status);
            if (!valido) {
                notifyError('Erros de validação encontrados:');
                return;
            }
            // Chama updateLesao passando o id e o objeto de atualização parcial
            const response = await updateLesao(updateStatusLesao.lesaoId, { status: updateStatusLesao.status });
            if (response && response.success) {
                notifySuccess(`Status atualizado para "${updateStatusLesao.status}" com sucesso!`);
                // Atualiza o status localmente para refletir na UI
                setSelectedLesao((prev) => prev ? { ...prev, status: updateStatusLesao.status } : prev);
                setListaLesoes((prev) =>
                    prev.map((l) =>
                        l._id === selectedLesao._id ? { ...l, status: updateStatusLesao.status } : l
                    )
                );
            } else {
                notifyError(response?.message || 'Erro ao atualizar status da lesão.');
            }
        } catch (error) {
            console.error('Erro ao atualizar status da lesão:', error);
            notifyError('Erro ao atualizar status da lesão.');
        } finally {
            hideLoading();
        }
    };

    const handleAddComentario = async () => {
        if (!selectedLesao || !novoComentario.trim() || isComentarioVazio(novoComentario)) return;
        showLoading();
        try {
            // Crie o novo comentário
            const comentario: Comentario = {
                userName: getUserDetails().nome,
                userId: getUserID(),
                content: novoComentario,
                createdAt: getCurrentDateTime(),
            };
            
            // Atualize a lesão com o novo comentário (push no array)
            const response = await updateLesao(selectedLesao._id!, {
                comentarios: [...selectedLesao.comentarios, comentario],
            });

            if (response && response.success) {
                notifySuccess('Comentário adicionado com sucesso!');
                // Atualiza o estado localmente
                setSelectedLesao((prev) =>
                    prev ? { ...prev, comentarios: [...prev.comentarios, comentario] } : prev
                );
                setListaLesoes((prev) =>
                    prev.map((l) =>
                        l._id === selectedLesao._id
                            ? { ...l, comentarios: [...l.comentarios, comentario] }
                            : l
                    )
                );
                setNovoComentario('');
            } else {
                notifyError(response?.message || 'Erro ao adicionar comentário.');
            }
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            notifyError('Erro ao adicionar comentário.');
        } finally {
            hideLoading();
        }
    };

    // *************************
    // *************************
    // USEEFFECTS
    // *************************
    // *************************

    useEffect(() => {
        const fetchData = async () => {
            showLoading();
            try {

                if (type === 'nova-lesao') {
                    const listaResidentes = await Residentes_GET_getAllActive();
                    setListaResidentes(listaResidentes);
                    hideLoading();
                }
                else if (type === 'tabela-lesoes') {
                    const listaLesoes: any = await getLesoes();
                    setListaLesoes(listaLesoes.data);
                    hideLoading();
                }

            } catch (error) {
                console.error('Erro ao carregar dados iniciais:', error);
            } finally {
                hideLoading();
            }
        };

        fetchData();

    }, [type]);


    // *************************
    // *************************
    // RETURN
    // *************************
    // *************************

    return (
        <PermissionWrapper href='/portal'>
            <PortalBase>
                <div className='col-span-full w-full'>

                    <div className="text-center grid grid-cols-12 gap-2 w-full text-gray-700">

                        <div className="col-span-full flex flex-row gap-2 ">
                            <FaPlusCircle size={30} className="text-indigo-500 cursor-pointer" onClick={() => setType('nova-lesao')} />
                            <FaTable size={30} className="text-green-500 cursor-pointer" onClick={() => setType('tabela-lesoes')} />
                        </div>

                        {type === 'nova-lesao' && (
                            <div className="col-span-full grid grid-cols-12 gap-2">
                                <h2 className="col-span-full text-sm italic uppercase font-bold">Nova Lesão</h2>

                                <div className='col-span-full sm:col-span-6 bg-white shadow-md rounded-lg'>
                                    <h2 className='text-xl font-semibold mb-2'>Selecione a Região do Corpo</h2>
                                    <HumanBodyImage imageSide="frente" onClickData={handleBodyClick} />
                                </div>

                                <div className='col-span-full sm:col-span-6 w-full mx-auto p-4 bg-white shadow-md rounded-lg'>
                                    <h2 className='text-xl font-semibold mb-2'>Dados Clínicos</h2>
                                    <form action="" className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                        <TextInputM2 name='regiaoCorpo' label='Região do Corpo' value={formData.regiaoCorpo || ''} onChange={() => null} disabled />
                                        <Select_M3 name='vista' label='Vista' value={formData.vista || ''} onChange={handleSelect} options={VISTA_TYPE_OPTIONS} />
                                        <Select_M3 name='tipoLesao' label='Tipo de Lesão' value={formData?.tipoLesao || ''} onChange={handleSelect} options={FERIDA_TYPE_OPTIONS} />
                                        <Date_M3 disabled={false} name='dataLesao' label='Data da Lesão' value={formData.dataLesao || ''} onChange={handleChange} />
                                        <Select_M3 name='userId' label='Idoso' value={formData.userId || ''} onChange={handleSelect} options={listaResidentes.map(residente => ({ value: residente._id, label: residente.nome }))} />
                                        <Number_M3 disabled={false} name='riscoInfeccao' label='Risco de Infecção (0 a 10)' value={formData.riscoInfeccao || 0} onChange={handleChange} maxValue={10} />
                                        <Number_M3 disabled={false} name='nivelDor' label='Nível de Dor (0 a 10)' value={formData.nivelDor || 0} onChange={handleChange} maxValue={10} />
                                        <Textarea_M3 name='descricao' label='Descrição' value={formData.descricao || ''} onChange={handleChange} className='col-span-full' />

                                        {formErrors.length > 0 && (
                                            <div className='col-span-full text-red-500 text-left'>
                                                <h3 className='font-semibold'>Erros de Validação:</h3>
                                                <ul className='list-disc pl-5'>
                                                    {formErrors.map((error, index) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className='flex flex-row gap-2 mx-auto items-center col-span-full'>
                                            <Button_M3 label='Limpar' bgColor='gray' onClick={handleClear} />
                                            <Button_M3 label='Salvar' onClick={handleSave} />
                                        </div>

                                    </form>
                                </div>
                            </div>
                        )}

                        {type === 'tabela-lesoes' && (
                            <div className="col-span-full w-full bg-white shadow-md rounded-lg p-4">
                                <h2 className="text-xl font-semibold mb-2">Tabela de Lesões</h2>
                                <table>
                                    <thead>
                                        <tr className='bg-black text-white font-bold'>
                                            <th className='px-2'>Idoso</th>
                                            <th className='px-2'>Status</th>
                                            <th className='px-2'>Data da Lesão</th>
                                            <th className='px-2'>Qtd. Comentários</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listaLesoes.length > 0 && listaLesoes
                                            .filter(lesao => lesao.status !== 'cancelada' && lesao.status !== 'encerrada')
                                            .map((lesao: Lesao) => (
                                                <tr key={lesao.userId} onClick={() => handleRowClick(lesao)} className='cursor-pointer hover:bg-cyan-200'>
                                                    <td className='px-2'>{lesao.userName}</td>
                                                    <td className='px-2'> {LESAO_STATUS_OPTIONS.find(opt => opt.value === lesao.status)?.label || lesao.status}</td>
                                                    <td className='px-2'>{formatDateBR(lesao.dataLesao)}</td>
                                                    <td className='px-2'>{lesao.comentarios.length}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>
                </div>

                <Modalpadrao isOpen={isModalOpen} onClose={() => setisModalOpen(false)}>
                    {selectedLesao && (
                        <div className="p-4 flex flex-col gap-2 justify-center mx-auto items-center">
                            <h3 className="text-lg font-bold mb-2">Detalhes da Lesão</h3>
                            <div className='max-w-[200px] bg-gray-50'>
                                <HumanBodyImage
                                    imageSide={'frente'}
                                    xPos={selectedLesao.xPos}
                                    yPos={selectedLesao.yPos}
                                    viewOnly={true}
                                    onClickData={() => null} // Desabilita o clique na imagem
                                />
                            </div>
                            <div className='border p-2 shadow-sm rounded-sm w-full bg-gray-50'>
                                <p className='hidden'><strong>ID:</strong> {selectedLesao._id}</p>
                                <p><strong>Idoso:</strong> {selectedLesao.userId}</p>
                                <p><strong>Data da Lesão:</strong> {formatDateBR(selectedLesao.dataLesao)}</p>
                                <p><strong>Status:</strong> {selectedLesao.status}</p>
                                <p><strong>Tipo de Lesão:</strong> {selectedLesao.tipoLesao}</p>
                                <p><strong>Região do Corpo:</strong> {selectedLesao.regiaoCorpo}</p>
                                <p><strong>Risco de Infecção:</strong> {selectedLesao.riscoInfeccao}</p>
                                <p><strong>Nível de Dor:</strong> {selectedLesao.nivelDor}</p>
                                <p><strong>Local da Ferida:</strong> {selectedLesao.vista}</p>
                            </div>

                            <div className='w-full mt-2 border shadow-sm rounded-sm p-2 bg-gray-50'>
                                <Select_M3 name='status' label='Andamento da Lesão' value={updateStatusLesao.status} onChange={handleChangeStatus} options={LESAO_STATUS_OPTIONS} />
                            </div>

                            <div className='w-full mt-2 border shadow-sm rounded-sm p-2 bg-gray-50'>
                                <p className='font-bold'>
                                    Descrição:
                                </p>
                                {selectedLesao.descricao}
                            </div>

                            <div className='w-full mt-2 border shadow-sm rounded-sm p-2 bg-gray-50'>
                                <p className='mb-2'><strong>Comentários</strong></p>
                                {selectedLesao.comentarios.length > 0 && (
                                    <ul className='list-disc pl-1'>
                                        {selectedLesao.comentarios.map((comentario, index) => (
                                            <li key={index} className="mb-2 flex items-start gap-2 border-b">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-blue-900">{comentario.userName}</span>
                                                        <span className="text-xs text-gray-500">{formatDateBRHora(comentario.createdAt)}</span>
                                                    </div>
                                                    <RichReadOnly_M3 value={comentario.content} label='' name='comentario' />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) || (
                                        <p className='italic text-gray-500'>Nenhum comentário registrado.</p>
                                    )}

                                <div>
                                    <RichText_M3 name='comentarios' onChange={(e, a) => setNovoComentario(a)} value={novoComentario} label='Novo Comentário' />
                                </div>


                                <div className='flex flex-row gap-2 justify-end mt-2'>
                                    {novoComentario.trim() != '' && novoComentario.trim() != undefined && novoComentario.trim() != null && !isComentarioVazio(novoComentario) && (
                                        <Button_M3 label='Adicionar Comentário' bgColor='blue' onClick={handleAddComentario} />
                                    )}

                                    {updateStatusLesao.status !== selectedLesao.status && updateStatusLesao.status !== '' && (
                                        <Button_M3 label='Atualizar Status' bgColor='green' onClick={handleUpdateStatus} />
                                    )}
                                </div>

                            </div>
                        </div>
                    )}
                </Modalpadrao>

            </PortalBase >
        </PermissionWrapper >
    )
}

export default Index