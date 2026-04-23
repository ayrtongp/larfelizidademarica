import React, { useEffect, useMemo, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import Tab_Clinico from '@/components/idosos/tabs/Tab_Clinico';

interface IdosoItem {
  _id: string;
  patient_id?: string;
  usuario?: { nome?: string; sobrenome?: string };
}

export default function SaudeClinicoPage() {
  const [idosos, setIdosos] = useState<IdosoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/Controller/C_idosoDetalhes?type=getAtivos')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list: IdosoItem[] = Array.isArray(data) ? data : [];
        setIdosos(list.filter((i) => !!i.patient_id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return idosos;
    return idosos.filter((i) => {
      const nome = `${i.usuario?.nome ?? ''} ${i.usuario?.sobrenome ?? ''}`.toLowerCase();
      return nome.includes(q);
    });
  }, [idosos, busca]);

  const selecionado = idosos.find((i) => i._id === selecionadoId) ?? null;

  function nomeCompleto(i: IdosoItem) {
    return `${i.usuario?.nome ?? ''} ${i.usuario?.sobrenome ?? ''}`.trim() || '—';
  }

  return (
    <PortalBase>
      <div className="col-span-full w-full space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clínico</h1>
          <p className="text-sm text-gray-500 mt-1">Alergias, comorbidades e histórico cirúrgico por residente</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">

          {/* Coluna seletor */}
          <div className="bg-white rounded-lg shadow p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Residente</p>

            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pelo nome..."
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />

            {loading ? (
              <p className="text-xs text-gray-400 py-2 text-center">Carregando...</p>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                {filtrados.length === 0 && (
                  <li className="py-3 text-xs text-gray-400 text-center">Nenhum residente encontrado.</li>
                )}
                {filtrados.map((i) => (
                  <li
                    key={i._id}
                    onClick={() => setSelecionadoId(i._id)}
                    className={`px-2 py-2 cursor-pointer rounded text-sm transition-colors ${
                      selecionadoId === i._id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {nomeCompleto(i)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Coluna conteúdo */}
          <div className="sm:col-span-2">
            {!selecionado ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">
                Selecione um residente para ver os dados clínicos.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-4 space-y-1">
                <p className="text-base font-semibold text-gray-800 mb-3">{nomeCompleto(selecionado)}</p>
                <Tab_Clinico key={selecionado.patient_id} patientId={selecionado.patient_id!} />
              </div>
            )}
          </div>

        </div>
      </div>
    </PortalBase>
  );
}
