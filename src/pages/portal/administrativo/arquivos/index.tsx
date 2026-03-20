import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import SelectSearchInputM2 from '@/components/Formularios/SelectSeachInputM2';
import GestaoArquivos from '@/components/Arquivos/GestaoArquivos';

interface Entidade {
    _id: string;
    label: string;
}

const ArquivosAdminPage = () => {
    const [opcoes, setOpcoes] = useState<{ value: string; label: string }[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<Entidade | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/Controller/ResidentesController?type=getAllActive').then(r => r.json()).catch(() => []),
            fetch('/api/Controller/Usuario').then(r => r.json()).catch(() => ({})),
        ]).then(([residentes, usuariosData]) => {
            const resOpcoes = (Array.isArray(residentes) ? residentes : []).map((r: any) => ({
                value: r._id,
                label: r.apelido ? `${r.apelido} — ${r.nome}` : r.nome,
            }));

            const usuOpcoes = (usuariosData?.usuarios ?? []).map((u: any) => ({
                value: u._id,
                label: [u.nome, u.sobrenome].filter(Boolean).join(' ') + (u.funcao ? ` (${u.funcao})` : ''),
            }));

            setOpcoes([...resOpcoes, ...usuOpcoes]);
        });
    }, []);

    return (
        <PermissionWrapper href='/portal' groups={['66955f79820cc8004aab9596']}>
            <PortalBase>
                <div className='col-span-full flex flex-col gap-6 p-2'>

                    <div className='bg-white rounded-xl shadow p-5'>
                        <h2 className='text-lg font-semibold text-gray-700 mb-4'>Gestão de Arquivos</h2>

                        <SelectSearchInputM2
                            name='entidade'
                            label2='Selecionar Residente ou Usuário'
                            options={opcoes}
                            onOptionSelect={opt => setSelectedEntity({ _id: opt.value, label: opt.label })}
                        />

                        {selectedEntity && (
                            <p className='text-sm text-gray-500 mt-2'>
                                Exibindo arquivos de: <strong>{selectedEntity.label}</strong>
                            </p>
                        )}
                    </div>

                    {selectedEntity && (
                        <GestaoArquivos
                            entityId={selectedEntity._id}
                            entityName={selectedEntity.label}
                        />
                    )}

                </div>
            </PortalBase>
        </PermissionWrapper>
    );
};

export default ArquivosAdminPage;
