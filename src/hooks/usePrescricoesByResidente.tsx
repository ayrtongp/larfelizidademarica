// hooks/usePrescricoesByResidente.ts
import { useState, useEffect, useCallback } from 'react';
import { Prescricao } from '@/models/prescricao.model';
import { getPrescricoesByResidente } from '@/services/prescricao.service';

export function usePrescricoesByResidente(residenteId: string) {
    const [data, setData] = useState<Prescricao[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getPrescricoesByResidente(residenteId);
        if (res.success) setData(res.data!);
        else setError(res.message || 'Erro desconhecido');
        setLoading(false);
    }, [residenteId]);

    useEffect(() => {
        if (residenteId) fetch();
    }, [residenteId, fetch]);

    return { data, loading, error, refetch: fetch };
}
