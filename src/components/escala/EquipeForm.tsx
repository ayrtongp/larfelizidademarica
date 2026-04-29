import React, { useEffect, useState } from 'react';
import { T_Equipe, EscalaMembro, EscalaRegra, TipoRegra } from '@/types/T_escala';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import S_prestadoresServico from '@/services/S_prestadoresServico';

const CORES = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const TIPO_LABELS: Record<TipoRegra, string> = {
  dias_semana: 'Dias fixos da semana',
  alternado: 'Dia sim / dia não',
  '12x36': '12h × 36h',
  '24x48': '24h × 48h',
};
const TIPO_CICLO: TipoRegra[] = ['alternado', '12x36', '24x48'];

interface CandidatoMembro {
  id: string;
  usuarioId?: string;
  nome: string;
  cargo: string;
  origem: 'clt' | 'prestador';
}

interface Props {
  equipe?: T_Equipe;
  onSalvar: (data: Omit<T_Equipe, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onFechar: () => void;
  salvando: boolean;
  erro?: string;
}

const REGRA_INICIAL: EscalaRegra = {
  tipo: 'dias_semana',
  diasSemana: [1, 2, 3, 4, 5],
  horarioEntrada: '07:00',
  horarioSaida: '17:00',
};

export default function EquipeForm({ equipe, onSalvar, onFechar, salvando, erro }: Props) {
  const [step, setStep] = useState(0);

  const [nome, setNome] = useState(equipe?.nome ?? '');
  const [descricao, setDescricao] = useState(equipe?.descricao ?? '');
  const [cor, setCor] = useState(equipe?.cor ?? CORES[0]);
  const [regra, setRegra] = useState<EscalaRegra>(equipe?.regra ?? REGRA_INICIAL);
  const [membros, setMembros] = useState<EscalaMembro[]>(equipe?.membros ?? []);

  const [candidatos, setCandidatos] = useState<CandidatoMembro[]>([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);
  const [abaMembrosFonte, setAbaMembrosFonte] = useState<'clt' | 'prestador' | 'manual'>('clt');

  // manual entry state
  const [manualNome, setManualNome] = useState('');
  const [manualCargo, setManualCargo] = useState('');

  useEffect(() => {
    setLoadingCandidatos(true);
    Promise.all([
      S_funcionariosCLT.getAtivos().catch(() => []),
      S_prestadoresServico.getAll({ status: 'ativo' }).catch(() => []),
    ]).then(([clts, prests]) => {
      const lista: CandidatoMembro[] = [
        ...clts.map((d) => ({
          id: d._id as string,
          usuarioId: d.usuarioId,
          nome: `${d.usuario?.nome ?? ''} ${d.usuario?.sobrenome ?? ''}`.trim(),
          cargo: d.contrato?.cargo ?? '',
          origem: 'clt' as const,
        })),
        ...prests.map((d) => ({
          id: d._id as string,
          usuarioId: d.usuarioId,
          nome: `${d.usuario?.nome ?? ''} ${d.usuario?.sobrenome ?? ''}`.trim(),
          cargo: d.contrato?.tipoServico ?? '',
          origem: 'prestador' as const,
        })),
      ];
      setCandidatos(lista);
    }).finally(() => setLoadingCandidatos(false));
  }, []);

  const toggleCandidato = (c: CandidatoMembro) => {
    const existe = membros.find((m) => m.funcionarioId === c.id);
    if (existe) {
      setMembros((m) => m.filter((x) => x.funcionarioId !== c.id));
    } else {
      setMembros((m) => [...m, {
        funcionarioId: c.id,
        usuarioId: c.usuarioId,
        nome: c.nome,
        cargo: c.cargo,
        tipo: c.origem,
      }]);
    }
  };

  const adicionarManual = () => {
    const n = manualNome.trim();
    if (!n) return;
    const uid = `manual-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setMembros((m) => [...m, { funcionarioId: uid, nome: n, cargo: manualCargo.trim(), tipo: 'manual' }]);
    setManualNome('');
    setManualCargo('');
  };

  const removerMembro = (funcionarioId: string) => {
    setMembros((m) => m.filter((x) => x.funcionarioId !== funcionarioId));
  };

  const setMembroRef = (funcionarioId: string, dataReferencia: string) => {
    setMembros((ms) =>
      ms.map((m) => (m.funcionarioId === funcionarioId ? { ...m, dataReferencia } : m))
    );
  };

  const toggleDia = (dow: number) => {
    const atual = regra.diasSemana ?? [];
    setRegra((r) => ({
      ...r,
      diasSemana: atual.includes(dow) ? atual.filter((d) => d !== dow) : [...atual, dow].sort(),
    }));
  };

  const handleSubmit = async () => {
    await onSalvar({ nome, descricao, cor, regra, membros, ativo: equipe?.ativo ?? true });
  };

  const canNext0 = nome.trim().length > 0;
  const canNext1 = regra.tipo === 'dias_semana'
    ? (regra.diasSemana?.length ?? 0) > 0
    : !!regra.dataReferencia;

  const candidatosFiltrados = candidatos.filter((c) => c.origem === abaMembrosFonte);
  const isCiclo = TIPO_CICLO.includes(regra.tipo);

  const ORIGEM_LABEL: Record<string, string> = { clt: 'CLT', prestador: 'Prestadores' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">
            {equipe ? 'Editar Equipe' : 'Nova Equipe'}
          </h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="flex gap-1 px-5 pt-4">
          {['Informações','Regra','Membros'].map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i === step ? 'bg-indigo-600 text-white' : i < step ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                {i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-indigo-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Step 0 — Info */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nome da equipe *</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Ex: Enfermagem Noturna"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Cor da equipe</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${cor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 1 — Regra */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de escala *</label>
                <select
                  value={regra.tipo}
                  onChange={(e) => setRegra((r) => ({ ...r, tipo: e.target.value as TipoRegra }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {(Object.entries(TIPO_LABELS) as [TipoRegra, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {regra.tipo === 'dias_semana' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Dias da semana *</label>
                  <div className="flex gap-2 flex-wrap">
                    {DIAS_SEMANA.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDia(i)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                          ${(regra.diasSemana ?? []).includes(i)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isCiclo && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Data de referência da equipe *
                    <span className="ml-1 font-normal text-gray-400">(membros podem ter referência própria)</span>
                  </label>
                  <input
                    type="date"
                    value={regra.dataReferencia ?? ''}
                    onChange={(e) => setRegra((r) => ({ ...r, dataReferencia: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Entrada</label>
                  <input
                    type="time"
                    value={regra.horarioEntrada}
                    onChange={(e) => setRegra((r) => ({ ...r, horarioEntrada: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Saída</label>
                  <input
                    type="time"
                    value={regra.horarioSaida}
                    onChange={(e) => setRegra((r) => ({ ...r, horarioSaida: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2 — Membros */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Membros já adicionados */}
              {membros.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1.5">
                    Membros selecionados ({membros.length})
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {membros.map((m) => (
                      <div key={m.funcionarioId} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800 truncate block">{m.nome}</span>
                          {m.cargo && <span className="text-xs text-gray-400">{m.cargo}</span>}
                          {m.tipo && <span className="ml-2 text-xs text-indigo-400 capitalize">{m.tipo}</span>}
                        </div>
                        {isCiclo && (
                          <input
                            type="date"
                            value={m.dataReferencia ?? ''}
                            onChange={(e) => setMembroRef(m.funcionarioId, e.target.value)}
                            className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            title="Data de referência própria"
                          />
                        )}
                        <button
                          onClick={() => removerMembro(m.funcionarioId)}
                          className="text-gray-400 hover:text-red-500 shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abas fonte */}
              <div className="flex gap-1 border-b border-gray-200">
                {(['clt', 'prestador', 'manual'] as const).map((fonte) => (
                  <button
                    key={fonte}
                    onClick={() => setAbaMembrosFonte(fonte)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors border-b-2 -mb-px
                      ${abaMembrosFonte === fonte
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    {fonte === 'clt' ? 'CLT' : fonte === 'prestador' ? 'Prestadores' : 'Manual'}
                  </button>
                ))}
              </div>

              {/* Lista CLT / Prestadores */}
              {abaMembrosFonte !== 'manual' && (
                <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                  {loadingCandidatos ? (
                    <p className="text-sm text-gray-400 text-center py-3">Carregando...</p>
                  ) : candidatosFiltrados.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">
                      Nenhum {ORIGEM_LABEL[abaMembrosFonte]} ativo encontrado.
                    </p>
                  ) : (
                    candidatosFiltrados.map((c) => {
                      const selecionado = membros.some((m) => m.funcionarioId === c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors
                            ${selecionado ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => toggleCandidato(c)}
                            className="accent-indigo-600 w-4 h-4 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{c.nome}</p>
                            {c.cargo && <p className="text-xs text-gray-400 truncate">{c.cargo}</p>}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {/* Entrada manual */}
              {abaMembrosFonte === 'manual' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nome *</label>
                    <input
                      value={manualNome}
                      onChange={(e) => setManualNome(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && adicionarManual()}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Função / Cargo</label>
                    <input
                      value={manualCargo}
                      onChange={(e) => setManualCargo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && adicionarManual()}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="Ex: Técnico de Enfermagem"
                    />
                  </div>
                  <button
                    onClick={adicionarManual}
                    disabled={!manualNome.trim()}
                    className="w-full py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {erro && <p className="px-5 pb-2 text-xs text-red-600">{erro}</p>}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={step === 0 ? onFechar : () => setStep((s) => s - 1)}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 ? !canNext0 : !canNext1}
              className="px-5 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={salvando}
              className="px-5 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {salvando ? 'Salvando...' : equipe ? 'Salvar alterações' : 'Criar equipe'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
