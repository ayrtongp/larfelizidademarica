import React, { useEffect, useState } from 'react';
import { T_Equipe, EscalaMembro } from '@/types/T_escala';
import { T_EscalaExcecao, TipoExcecao } from '@/types/T_escalaExcecao';
import { equipesEmDia } from '@/utils/escalaUtils';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import S_prestadoresServico from '@/services/S_prestadoresServico';

const TIPO_LABEL: Record<TipoExcecao, string> = { falta: 'Falta', extra: 'Extra', troca: 'Troca' };
const TIPO_COR: Record<TipoExcecao, string> = {
  falta:  'bg-red-100 text-red-700 border-red-200',
  extra:  'bg-green-100 text-green-700 border-green-200',
  troca:  'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function fmtDataBR(iso: string) {
  const [y, m, d] = iso.split('-');
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const dow = new Date(`${iso}T00:00:00`).getDay();
  return `${dias[dow]}, ${d}/${m}/${y}`;
}

interface CandidatoExtra {
  id: string;
  nome: string;
  cargo: string;
  usuarioId?: string;
}

interface FormExcecao {
  equipeId: string;
  equipeNome: string;
  funcionarioId: string;
  nome: string;
  tipo: TipoExcecao;
  observacao: string;
}

interface Props {
  data: string; // YYYY-MM-DD
  equipes: T_Equipe[];
  excecoes: T_EscalaExcecao[];
  onSalvar: (exc: Omit<T_EscalaExcecao, '_id' | 'createdAt'>) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
  onFechar: () => void;
  salvando: boolean;
}

export default function DiaDetalhePanel({
  data, equipes, excecoes, onSalvar, onRemover, onFechar, salvando,
}: Props) {
  const date = new Date(`${data}T00:00:00`);
  const entradasDia = equipesEmDia(equipes, date);

  const [form, setForm] = useState<FormExcecao | null>(null);
  const [candidatos, setCandidatos] = useState<CandidatoExtra[]>([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);
  const [extraBusca, setExtraBusca] = useState('');
  const [manualNome, setManualNome] = useState('');

  const excDia = excecoes.filter((e) => e.data === data);

  const excDeMembro = (equipeId: string, funcionarioId: string) =>
    excDia.find((e) => e.equipeId === equipeId && e.funcionarioId === funcionarioId);

  useEffect(() => {
    setLoadingCandidatos(true);
    Promise.all([
      S_funcionariosCLT.getAtivos().catch(() => []),
      S_prestadoresServico.getAll({ status: 'ativo' }).catch(() => []),
    ]).then(([clts, prests]) => {
      setCandidatos([
        ...clts.map((d) => ({
          id: d._id as string,
          nome: `${d.usuario?.nome ?? ''} ${d.usuario?.sobrenome ?? ''}`.trim(),
          cargo: d.contrato?.cargo ?? '',
          usuarioId: d.usuarioId,
        })),
        ...prests.map((d) => ({
          id: d._id as string,
          nome: `${d.usuario?.nome ?? ''} ${d.usuario?.sobrenome ?? ''}`.trim(),
          cargo: d.contrato?.tipoServico ?? '',
          usuarioId: d.usuarioId,
        })),
      ]);
    }).finally(() => setLoadingCandidatos(false));
  }, []);

  const abrirForm = (
    equipe: T_Equipe,
    membro: EscalaMembro,
    tipo: TipoExcecao
  ) => {
    setForm({
      equipeId: equipe._id!,
      equipeNome: equipe.nome,
      funcionarioId: membro.funcionarioId,
      nome: membro.nome,
      tipo,
      observacao: '',
    });
    setExtraBusca('');
    setManualNome('');
  };

  const abrirFormExtra = (equipe: T_Equipe) => {
    setForm({
      equipeId: equipe._id!,
      equipeNome: equipe.nome,
      funcionarioId: '',
      nome: '',
      tipo: 'extra',
      observacao: '',
    });
    setExtraBusca('');
    setManualNome('');
  };

  const handleConfirmar = async () => {
    if (!form) return;
    const nomeFinal = form.nome || manualNome.trim();
    const idFinal   = form.funcionarioId || `extra-${Date.now()}`;
    if (!nomeFinal) return;
    await onSalvar({ ...form, funcionarioId: idFinal, nome: nomeFinal, data });
    setForm(null);
  };

  const candidatosFiltrados = candidatos.filter(
    (c) =>
      c.nome.toLowerCase().includes(extraBusca.toLowerCase()) ||
      c.cargo.toLowerCase().includes(extraBusca.toLowerCase())
  ).slice(0, 8);

  if (entradasDia.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">{fmtDataBR(data)}</h2>
            <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma equipe escalada para este dia.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '88vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{fmtDataBR(data)}</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {entradasDia.map(({ equipe, membros }) => {
            const extrasEquipe = excDia.filter(
              (e) => e.equipeId === equipe._id && e.tipo === 'extra'
            );

            return (
              <div key={equipe._id} className="space-y-1.5">
                {/* Team header */}
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: equipe.cor }}
                >
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  {equipe.nome}
                  <span className="ml-auto text-xs font-normal opacity-80">
                    {equipe.regra.horarioEntrada} – {equipe.regra.horarioSaida}
                  </span>
                </div>

                {/* Membros escalados */}
                {membros.length === 0 ? (
                  <p className="text-xs text-gray-400 pl-3">Sem membros cadastrados.</p>
                ) : (
                  membros.map((m) => {
                    const exc = excDeMembro(equipe._id!, m.funcionarioId);
                    return (
                      <div
                        key={m.funcionarioId}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <span className="flex-1 text-sm text-gray-800 truncate">{m.nome}</span>
                        {exc ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIPO_COR[exc.tipo]}`}>
                              {TIPO_LABEL[exc.tipo]}
                              {exc.observacao && ` — ${exc.observacao}`}
                            </span>
                            <button
                              onClick={() => onRemover(exc._id!)}
                              className="text-gray-300 hover:text-red-400"
                              title="Remover exceção"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 shrink-0">
                            {(['falta', 'troca'] as TipoExcecao[]).map((tipo) => (
                              <button
                                key={tipo}
                                onClick={() => abrirForm(equipe, m, tipo)}
                                className="px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                              >
                                {TIPO_LABEL[tipo]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Extras já adicionados */}
                {extrasEquipe.map((e) => (
                  <div key={e._id} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                    <span className="flex-1 text-sm text-gray-800 truncate">{e.nome}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200 shrink-0">
                      Extra{e.observacao ? ` — ${e.observacao}` : ''}
                    </span>
                    <button
                      onClick={() => onRemover(e._id!)}
                      className="text-gray-300 hover:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Adicionar extra */}
                <button
                  onClick={() => abrirFormExtra(equipe)}
                  className="w-full text-xs text-left px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
                >
                  + Adicionar extra nesta equipe
                </button>
              </div>
            );
          })}
        </div>

        {/* Form de exceção */}
        {form && (
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">
                {form.tipo === 'extra' ? 'Adicionar extra' : `Registrar ${TIPO_LABEL[form.tipo]}`}
                {form.nome && <span className="font-normal text-gray-500"> — {form.nome}</span>}
              </p>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 text-xs">cancelar</button>
            </div>

            {/* Seleção de pessoa para "extra" */}
            {form.tipo === 'extra' && !form.nome && (
              <div className="space-y-2">
                <input
                  value={extraBusca}
                  onChange={(e) => setExtraBusca(e.target.value)}
                  placeholder="Buscar por nome ou cargo..."
                  className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {loadingCandidatos ? (
                  <p className="text-xs text-gray-400">Carregando...</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {candidatosFiltrados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setForm((f) => f ? { ...f, funcionarioId: c.id, nome: c.nome } : f)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-indigo-50 text-gray-700"
                      >
                        <span className="font-medium">{c.nome}</span>
                        {c.cargo && <span className="text-gray-400 text-xs ml-2">{c.cargo}</span>}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 pt-1 mt-1">
                      <p className="text-xs text-gray-400 mb-1">Ou digitar manualmente:</p>
                      <input
                        value={manualNome}
                        onChange={(e) => setManualNome(e.target.value)}
                        placeholder="Nome livre..."
                        className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.tipo === 'extra' && form.nome && (
              <p className="text-sm text-indigo-700 font-medium">{form.nome}</p>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Motivo / observação <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                value={form.observacao}
                onChange={(e) => setForm((f) => f ? { ...f, observacao: e.target.value } : f)}
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Ex: atestado médico, cobertura de plantão..."
              />
            </div>

            <button
              onClick={handleConfirmar}
              disabled={salvando || (form.tipo === 'extra' && !form.nome && !manualNome.trim())}
              className="w-full py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors"
            >
              {salvando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
