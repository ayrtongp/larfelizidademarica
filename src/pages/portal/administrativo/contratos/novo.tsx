import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Text_M3 from '@/components/Formularios/Text_M3';
import Date_M3 from '@/components/Formularios/Date_M3';
import Select_M3 from '@/components/Formularios/Select_M3';
import TextArea_M3 from '@/components/Formularios/TextArea_M3';
import Button_M3 from '@/components/Formularios/Button_M3';
import { createContrato } from '@/services/contratos.service';
import {
    CONTRATO_TYPE_OPTIONS,
    CONTRATO_STATUS_OPTIONS,
    CONTRATO_REGIME_OPTIONS,
    CONTRATO_PERIODICIDADE_OPTIONS,
    CONTRATO_PAPEL_OPTIONS,
} from '@/models/contratos.model';
import { useLoadingOverlay } from '@/context/LoadingOverlayContext';
import { notifyError, notifySuccess } from '@/utils/Functions';
import MoneyInput from '@/components/Formularios/MoneyInputM2';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase'
import { Residentes_GET_getAllActive } from '@/actions/Residentes';
import Number_M3 from '@/components/Formularios/Number_M3';

interface ResidentOption {
    label: string;
    value: string;
}

export default function NewContratoPage() {
    const router = useRouter();
    const { showLoading, hideLoading } = useLoadingOverlay();
    const [residentOptions, setResidentOptions] = useState<ResidentOption[]>([]);
    const [formData, setFormData] = useState({
        usuario_id: '',
        data_assinatura: '',
        data_inicio: '',
        data_fim: '',
        dia_pagamento: 0,
        valor: '',
        tipo: '',
        status: '',
        regime_pagamento: '',
        periodicidade: '',
        papel: '',
        observacoes: '',
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadResidentes() {
            try {
                const res = await Residentes_GET_getAllActive();
                console.log(res);
                if (res.length < 1) throw new Error('Erro ao carregar residentes');
                setResidentOptions(res.map((r: any) => ({ label: r.nome, value: r._id })));
            } catch (e: any) {
                console.error(e);
                notifyError(e.message || 'Erro ao carregar residentes');
            }
        }
        loadResidentes();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        showLoading();
        console.log(formData);
        try {
            const res = await createContrato({
                usuario_id: formData.usuario_id,
                data_assinatura: formData.data_assinatura,
                data_inicio: formData.data_inicio,
                data_fim: formData.data_fim || undefined,
                dia_pagamento: formData.dia_pagamento,
                valor: parseFloat(formData.valor),
                tipo: formData.tipo as any,
                status: formData.status as any,
                regime_pagamento: formData.regime_pagamento as any,
                periodicidade: formData.periodicidade as any,
                papel: formData.papel as any,
                observacoes: formData.observacoes || undefined,
            });
            console.log(res);
            notifySuccess('Contrato criado com sucesso.');
            router.push('/portal/administrativo/contratos');
        } catch (err: any) {
            console.error(err);
            notifyError(err.message || 'Erro ao criar contrato.');
            setError(err.message || 'Erro ao criar contrato');
        } finally {
            hideLoading();
        }
    };

    return (
        <PermissionWrapper href='/portal'>
            <PortalBase>
                <div className="p-4 w-full mx-auto col-span-full">
                    <h1 className="text-2xl font-semibold mb-6">Novo Contrato</h1>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Select_M3
                            label="Residente"
                            name="usuario_id"
                            options={residentOptions}
                            value={formData.usuario_id}
                            onChange={handleChange}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Date_M3
                                disabled={false}
                                label="Data de Assinatura"
                                name="data_assinatura"
                                value={formData.data_assinatura}
                                onChange={handleChange}
                            />
                            <Date_M3
                                disabled={false}
                                label="Data de Início"
                                name="data_inicio"
                                value={formData.data_inicio}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Date_M3
                                disabled={false}
                                label="Data de Fim"
                                name="data_fim"
                                value={formData.data_fim}
                                onChange={handleChange}
                            />
                            <Number_M3
                                disabled={false}
                                label="Dia de Pagamento"
                                name="dia_pagamento"
                                value={formData.dia_pagamento}
                                onChange={handleChange}
                            />
                        </div>

                        <MoneyInput
                            disabled={false}
                            label="Valor"
                            name="valor"
                            value={formData.valor}
                            onChange={handleChange}
                        />

                        <Select_M3
                            label="Tipo"
                            name="tipo"
                            options={[...CONTRATO_TYPE_OPTIONS]}
                            value={formData.tipo}
                            onChange={handleChange}
                        />

                        <Select_M3
                            label="Status"
                            name="status"
                            options={[...CONTRATO_STATUS_OPTIONS]}
                            value={formData.status}
                            onChange={handleChange}
                        />

                        <Select_M3
                            label="Regime de Pagamento"
                            name="regime_pagamento"
                            options={[...CONTRATO_REGIME_OPTIONS]}
                            value={formData.regime_pagamento}
                            onChange={handleChange}
                        />

                        <Select_M3
                            label="Periodicidade"
                            name="periodicidade"
                            options={[...CONTRATO_PERIODICIDADE_OPTIONS]}
                            value={formData.periodicidade}
                            onChange={handleChange}
                        />

                        <Select_M3
                            label="Papel"
                            name="papel"
                            options={[...CONTRATO_PAPEL_OPTIONS]}
                            value={formData.papel}
                            onChange={handleChange}
                        />

                        <TextArea_M3
                            disabled={false}
                            label="Observações"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button_M3
                                label="Cancelar"
                                onClick={() => router.push('/portal/administrativo/contratos')}
                            />
                            <Button_M3 label="Salvar" onClick={handleSubmit} />
                        </div>
                    </form>
                </div>
            </PortalBase>
        </PermissionWrapper>
    );
}
