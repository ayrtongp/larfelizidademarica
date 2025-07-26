// hooks/usePrescricaoForm.ts
import { useState } from 'react';
import { Prescricao } from '@/models/prescricao.model';
import { createPrescricao, updatePrescricao } from '@/services/prescricao.service';
import { getUserID } from '@/utils/Login';

interface UsePrescricaoFormProps {
    initialData?: Prescricao;
    onSuccess?: () => void;
}

export function usePrescricaoForm({ initialData, onSuccess }: UsePrescricaoFormProps) {
    const medicoId = getUserID();

    const initialState: Partial<Prescricao> = {
        medicamento: '',
        via: 'oral',
        usoSOS: false,
        horarios: [],
        observacoes: '',
        status: 'aguardando',
        dataInicio: new Date().toISOString().slice(0, 10),
        dataFim: '',
        medicoId: medicoId,
        ...initialData,
    }
    
    const [formValues, setFormValues] = useState<Partial<Prescricao>>(initialState);

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleChange(field: keyof Prescricao, value: any) {
        setFormValues(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    }

    async function handleSubmit() {
        setSubmitting(true);
        setErrors({});
        try {
            // CRIAÇÃO: passa 1 argumento
            const res = await createPrescricao(
                formValues as Prescricao
            );

            if (!res.success) {
                const fieldErrs: Record<string, string> = {};
                (res.erros || []).forEach(e => {
                    fieldErrs._global = (fieldErrs._global || '') + e + '. ';
                });
                setErrors(fieldErrs);
            } else {
                onSuccess?.();
            }
        } catch {
            setErrors({ _global: 'Erro ao enviar formulário.' });
        }
        setSubmitting(false);
    }

    function resetForm() {
        setFormValues({
            medicamento: '',
            via: 'oral',
            usoSOS: false,
            horarios: [],
            observacoes: '',
            status: 'aguardando',
            dataInicio: new Date().toISOString().slice(0, 10),
            dataFim: '',
        });
        setErrors({});
    }

    return {
        formValues,
        errors,
        submitting,
        handleChange,
        handleSubmit,
        resetForm,
    };
}
