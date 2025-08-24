import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContratosPaginated } from '@/services/contratos.service';
import { Contrato } from '@/models/contratos.model';
import Button_M3 from '@/components/Formularios/Button_M3';
import { useLoadingOverlay } from '@/context/LoadingOverlayContext';
import PortalBase from '@/components/Portal/PortalBase'
import PermissionWrapper from '@/components/PermissionWrapper';
import { formatDateBR } from '@/utils/Functions';


export default function ContratosPage() {
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { showLoading, hideLoading } = useLoadingOverlay();

    useEffect(() => {
        async function fetchData() {
            showLoading();
            try {
                const { data } = await getContratosPaginated(1, 10);
                setContratos(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Erro ao carregar contratos');
            } finally {
                hideLoading();
            }
        }
        fetchData();
    }, []);

    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <PermissionWrapper href='/portal'>
            <PortalBase>
                <div className="p-4 col-span-full">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-semibold">Contratos</h1>
                        <Link href="/portal/administrativo/contratos/novo">
                            <Button_M3 label="+ Novo Contrato" onClick={() => { }} />
                        </Link>
                    </div>

                    {contratos.length === 0 ? (
                        <p>Nenhum contrato encontrado.</p>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className="min-w-full table-auto bg-white shadow rounded-lg ">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Número</th>
                                        <th className="px-4 py-2 text-left">Assinatura</th>
                                        <th className="px-4 py-2 text-left">Início</th>
                                        <th className="px-4 py-2 text-left">Fim</th>
                                        <th className="px-4 py-2 text-right">Valor</th>
                                        <th className="px-4 py-2 text-left">Tipo</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Regime</th>
                                        <th className="px-4 py-2 text-left">Periodicidade</th>
                                        <th className="px-4 py-2 text-left">Papel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contratos.map((c) => (
                                        <tr key={c._id.toString()} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="px-4 py-2">{c.numero_contrato}</td>
                                            <td className="px-4 py-2">{formatDateBR(c.data_assinatura)}</td>
                                            <td className="px-4 py-2">{formatDateBR(c.data_inicio)}</td>
                                            <td className="px-4 py-2">{formatDateBR(c.data_fim) || '-'}</td>
                                            <td className="px-4 py-2 text-right">
                                                {c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className="px-4 py-2">{c.tipo}</td>
                                            <td className="px-4 py-2">{c.status}</td>
                                            <td className="px-4 py-2">{c.regime_pagamento}</td>
                                            <td className="px-4 py-2">{c.periodicidade}</td>
                                            <td className="px-4 py-2">{c.papel}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </PortalBase>
        </PermissionWrapper>
    );
}
