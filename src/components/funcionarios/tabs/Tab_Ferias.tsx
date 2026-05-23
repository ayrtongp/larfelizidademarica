import React, { useRef, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Ferias } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { uploadArquivoPasta, deleteArquivoPastaSubPasta } from '@/actions/DO_UploadFile';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function calcDias(ini?: string, fim?: string): number {
  if (!ini || !fim) return 0;
  const diff = Math.round((new Date(fim).getTime() - new Date(ini).getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

function addAnos(dateStr: string, anos: number): Date {
  const d = new Date(dateStr + 'T12:00:00');
  d.setFullYear(d.getFullYear() + anos);
  return d;
}

// ─── cálculo de períodos CLT ─────────────────────────────────────────────────

type StatusPeriodo = 'em_aquisicao' | 'disponivel' | 'atencao' | 'vencido' | 'concluido';

interface PeriodoCLT {
  numero: number;
  iniAquisitivo: Date;
  fimAquisitivo: Date;
  iniConcessivo: Date;
  fimConcessivo: Date;
  diasDireito: number;   // 30 quando aquisitivo completo, 0 quando em aquisição
  diasGozados: number;
  status: StatusPeriodo;
  feriasDoPeriodo: T_Ferias[];
  progressPercent?: number;        // só para em_aquisicao
  diasParaCompletar?: number;      // só para em_aquisicao
  diasAteVencer?: number;          // só para disponivel / atencao
}

function calcularPeriodos(dataAdmissao: string, ferias: T_Ferias[]): PeriodoCLT[] {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const periodos: PeriodoCLT[] = [];

  for (let n = 1; n <= 50; n++) {
    const iniAquisitivo = addAnos(dataAdmissao, n - 1);
    if (iniAquisitivo > hoje) break;

    const fimAquisitivo = new Date(addAnos(dataAdmissao, n));
    fimAquisitivo.setDate(fimAquisitivo.getDate() - 1);
    fimAquisitivo.setHours(12, 0, 0, 0);

    const iniConcessivo = addAnos(dataAdmissao, n);
    const fimConcessivo = new Date(addAnos(dataAdmissao, n + 1));
    fimConcessivo.setDate(fimConcessivo.getDate() - 1);
    fimConcessivo.setHours(12, 0, 0, 0);

    if (fimAquisitivo >= hoje) {
      // período aquisitivo ainda em andamento
      const totalMs = fimAquisitivo.getTime() - iniAquisitivo.getTime();
      const doneMs = hoje.getTime() - iniAquisitivo.getTime();
      const progressPercent = Math.min(99, Math.round((doneMs / totalMs) * 100));
      const diasParaCompletar = Math.ceil((fimAquisitivo.getTime() - hoje.getTime()) / 86400000);
      periodos.push({
        numero: n,
        iniAquisitivo,
        fimAquisitivo,
        iniConcessivo,
        fimConcessivo,
        diasDireito: 0,
        diasGozados: 0,
        status: 'em_aquisicao',
        feriasDoPeriodo: [],
        progressPercent,
        diasParaCompletar,
      });
      break;
    }

    // férias gozadas dentro da janela concessiva deste período
    const feriasDoPeriodo = ferias.filter(f => {
      if (!f.dataInicio) return false;
      const ini = new Date(f.dataInicio + 'T12:00:00');
      return ini >= iniConcessivo && ini <= fimConcessivo;
    });

    const diasGozados = feriasDoPeriodo.reduce(
      (acc, f) => acc + (f.diasGozados ?? calcDias(f.dataInicio, f.dataFim)),
      0
    );
    const diasRestantes = Math.max(0, 30 - diasGozados);

    let status: StatusPeriodo;
    let diasAteVencer: number | undefined;

    if (fimConcessivo < hoje) {
      status = diasRestantes === 0 ? 'concluido' : 'vencido';
    } else {
      diasAteVencer = Math.ceil((fimConcessivo.getTime() - hoje.getTime()) / 86400000);
      if (diasRestantes === 0) {
        status = 'concluido';
      } else {
        status = diasAteVencer <= 60 ? 'atencao' : 'disponivel';
      }
    }

    periodos.push({
      numero: n,
      iniAquisitivo,
      fimAquisitivo,
      iniConcessivo,
      fimConcessivo,
      diasDireito: 30,
      diasGozados,
      status,
      feriasDoPeriodo,
      diasAteVencer,
    });
  }

  return periodos;
}

// ─── status config ──────────────────────────────────────────────────────────

const STATUS_CFG: Record<StatusPeriodo, { label: string; badge: string; row: string }> = {
  em_aquisicao: { label: 'Em aquisição', badge: 'bg-gray-100 text-gray-600', row: '' },
  disponivel:   { label: 'Disponível',   badge: 'bg-green-100 text-green-800', row: 'bg-green-50' },
  atencao:      { label: 'Atenção',      badge: 'bg-yellow-100 text-yellow-800', row: 'bg-yellow-50' },
  vencido:      { label: 'Vencido ⚠',   badge: 'bg-red-100 text-red-800', row: 'bg-red-50' },
  concluido:    { label: 'Concluído',    badge: 'bg-blue-100 text-blue-700', row: '' },
};

// ─── component ───────────────────────────────────────────────────────────────

const emptyFerias: T_Ferias = { dataInicio: '', dataFim: '', observacoes: '' };

interface Props {
  funcionarioId: string;
  ferias: T_Ferias[];
  dataAdmissao?: string;
  onUpdate: (ferias: T_Ferias[]) => void;
}

function getStatusGozado(f: T_Ferias): 'andamento' | 'agendado' | 'encerrado' {
  if (!f.dataInicio || !f.dataFim) return 'encerrado';
  const hoje = new Date();
  const ini = new Date(f.dataInicio);
  const fim = new Date(f.dataFim);
  if (ini <= hoje && hoje <= fim) return 'andamento';
  if (ini > hoje) return 'agendado';
  return 'encerrado';
}

const Tab_Ferias: React.FC<Props> = ({ funcionarioId, ferias: initial, dataAdmissao, onUpdate }) => {
  const [ferias, setFerias] = useState<T_Ferias[]>(initial ?? []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<T_Ferias>({ ...emptyFerias });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const periodos = dataAdmissao ? calcularPeriodos(dataAdmissao, ferias) : [];

  const saldoDisponivel = periodos
    .filter(p => p.status === 'disponivel' || p.status === 'atencao')
    .reduce((acc, p) => acc + Math.max(0, p.diasDireito - p.diasGozados), 0);

  const periodosVencidos = periodos.filter(p => p.status === 'vencido');

  // férias sem período concessivo identificado (ex: gozadas antes do 1º aniversário)
  const feriasSemPeriodo = ferias.filter(f => {
    if (!f.dataInicio || !dataAdmissao) return false;
    return !periodos.some(p =>
      p.status !== 'em_aquisicao' &&
      new Date(f.dataInicio + 'T12:00:00') >= p.iniConcessivo &&
      new Date(f.dataInicio + 'T12:00:00') <= p.fimConcessivo
    );
  });

  const handleNovo = () => {
    setForm({ ...emptyFerias });
    setArquivo(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(true);
  };

  const handleSalvar = async () => {
    if (!form.dataInicio || !form.dataFim) { notifyError('Período de férias é obrigatório.'); return; }
    if (new Date(form.dataFim) < new Date(form.dataInicio)) { notifyError('Data fim deve ser após a data de início.'); return; }
    if (!arquivo) { notifyError('Documento de concessão é obrigatório.'); return; }
    try {
      setSaving(true);
      let novasFerias: T_Ferias = {
        ...form,
        diasGozados: calcDias(form.dataInicio, form.dataFim),
        createdAt: new Date().toISOString(),
      };
      if (arquivo) {
        const uploaded = await uploadArquivoPasta(
          arquivo,
          `funcionarios_clt/${funcionarioId}/ferias`,
          arquivo.name
        );
        if (!uploaded) { notifyError('Falha ao enviar o arquivo. Tente novamente.'); setSaving(false); return; }
        novasFerias = {
          ...novasFerias,
          arquivoUrl: uploaded.cloudURL,
          arquivoNome: uploaded.filename,
          arquivoCloudNome: uploaded.cloudFilename,
        };
      }
      await S_funcionariosCLT.addFerias(funcionarioId, novasFerias);
      const updated = [...ferias, novasFerias];
      setFerias(updated);
      onUpdate(updated);
      setShowForm(false);
      notifySuccess('Período de férias registrado!');
    } catch {
      notifyError('Erro ao registrar férias.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Remover este período de férias?')) return;
    try {
      const f = ferias[index];
      if (f.arquivoCloudNome) {
        await deleteArquivoPastaSubPasta(
          `funcionarios_clt/${funcionarioId}/ferias`,
          f.arquivoCloudNome
        );
      }
      await S_funcionariosCLT.deleteFerias(funcionarioId, index);
      const updated = ferias.filter((_, i) => i !== index);
      setFerias(updated);
      onUpdate(updated);
      notifySuccess('Período de férias removido.');
    } catch {
      notifyError('Erro ao remover período de férias.');
    }
  };

  const diasCalculados = calcDias(form.dataInicio, form.dataFim);
  const periodoValido = form.dataInicio && form.dataFim && new Date(form.dataFim) >= new Date(form.dataInicio);

  return (
    <div className="space-y-5">

      {/* ── Mapeamento de Períodos ─────────────────────────────── */}
      {dataAdmissao ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Mapeamento de Períodos — CLT</h3>
            <span className="text-xs text-gray-400">Admissão: {formatDateBR(dataAdmissao)}</span>
          </div>

          {/* Resumo de saldo */}
          <div className={`rounded-lg p-3 mb-3 flex flex-wrap gap-4 items-center text-sm border ${
            periodosVencidos.length > 0
              ? 'bg-red-50 border-red-200'
              : saldoDisponivel > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
          }`}>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Saldo disponível</p>
              <p className={`text-xl font-bold ${saldoDisponivel > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                {saldoDisponivel} dia{saldoDisponivel !== 1 ? 's' : ''}
              </p>
            </div>
            {periodosVencidos.length > 0 && (
              <div className="border-l border-red-300 pl-4">
                <p className="text-xs text-red-600 font-semibold uppercase">Períodos vencidos</p>
                <p className="text-xl font-bold text-red-700">{periodosVencidos.length}</p>
                <p className="text-xs text-red-500 mt-0.5">
                  {periodosVencidos.reduce((a, p) => a + Math.max(0, 30 - p.diasGozados), 0)} dias em atraso
                </p>
              </div>
            )}
            <div className="border-l border-gray-300 pl-4">
              <p className="text-xs text-gray-500 uppercase font-semibold">Total gozado</p>
              <p className="text-xl font-bold text-gray-700">
                {ferias.reduce((a, f) => a + (f.diasGozados ?? calcDias(f.dataInicio, f.dataFim)), 0)} dias
              </p>
            </div>
          </div>

          {/* Tabela de períodos */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2">Período</th>
                  <th className="px-3 py-2">Aquisitivo</th>
                  <th className="px-3 py-2">Concessivo</th>
                  <th className="px-3 py-2 text-center">Direito</th>
                  <th className="px-3 py-2 text-center">Gozado</th>
                  <th className="px-3 py-2 text-center">Saldo</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...periodos].reverse().map((p) => {
                  const cfg = STATUS_CFG[p.status];
                  const saldo = Math.max(0, p.diasDireito - p.diasGozados);
                  return (
                    <tr key={p.numero} className={`${cfg.row}`}>
                      <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                        {p.numero}º período
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                        {fmt(p.iniAquisitivo)} – {fmt(p.fimAquisitivo)}
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                        {p.status === 'em_aquisicao' ? (
                          <span className="text-gray-400 italic">
                            a partir de {fmt(p.iniConcessivo)}
                          </span>
                        ) : (
                          <>
                            {fmt(p.iniConcessivo)} – {fmt(p.fimConcessivo)}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">
                        {p.status === 'em_aquisicao' ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : '30'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{p.diasGozados || '—'}</td>
                      <td className="px-3 py-2 text-center font-semibold">
                        {p.status === 'em_aquisicao' ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          <span className={saldo > 0 ? (p.status === 'vencido' ? 'text-red-600' : 'text-green-700') : 'text-gray-400'}>
                            {saldo}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          {p.status === 'em_aquisicao' && p.progressPercent !== undefined && (
                            <div className="mt-1.5">
                              <div className="w-32 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${p.progressPercent}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {p.progressPercent}% — faltam {p.diasParaCompletar}d
                              </p>
                            </div>
                          )}
                          {(p.status === 'disponivel' || p.status === 'atencao') && p.diasAteVencer !== undefined && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Conceder até {fmt(p.fimConcessivo)}
                              {p.status === 'atencao' && (
                                <span className="ml-1 text-yellow-600 font-semibold">({p.diasAteVencer}d)</span>
                              )}
                            </p>
                          )}
                          {p.status === 'vencido' && (
                            <p className="text-xs text-red-500 mt-0.5">
                              Venceu em {fmt(p.fimConcessivo)}
                            </p>
                          )}
                          {p.feriasDoPeriodo.length > 0 && (
                            <p className="text-xs text-indigo-600 mt-0.5">
                              {p.feriasDoPeriodo.length} registro{p.feriasDoPeriodo.length > 1 ? 's' : ''} neste período
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {feriasSemPeriodo.length > 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              ⓘ {feriasSemPeriodo.length} registro(s) não se enquadra(m) em nenhuma janela concessiva — podem ter sido gozados antecipadamente.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Data de admissão não informada. Preencha a aba <strong>Contrato CLT</strong> para habilitar o mapeamento de períodos.
        </div>
      )}

      {/* ── Registrar novo período ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Histórico de Férias Gozadas</h3>
          {!showForm && (
            <Button_M3 label="+ Registrar Férias" onClick={handleNovo} type="button" />
          )}
        </div>

        {showForm && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
            <h4 className="text-sm font-semibold text-blue-800 mb-3">Registrar Período de Férias</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Início das Férias *</label>
                <input type="date" value={form.dataInicio}
                  onChange={(e) => setForm((p) => ({ ...p, dataInicio: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fim das Férias *</label>
                <input type="date" value={form.dataFim}
                  onChange={(e) => setForm((p) => ({ ...p, dataFim: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              {periodoValido && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-blue-700 font-semibold bg-blue-100 px-2 py-1 rounded">
                    {diasCalculados} dia{diasCalculados !== 1 ? 's' : ''} de férias
                  </span>
                  {dataAdmissao && (() => {
                    const periodoCorrespondente = periodos.find(p => {
                      if (p.status === 'em_aquisicao') return false;
                      const ini = new Date(form.dataInicio + 'T12:00:00');
                      return ini >= p.iniConcessivo && ini <= p.fimConcessivo;
                    });
                    return periodoCorrespondente ? (
                      <span className="ml-2 text-xs text-indigo-600">
                        → será lançado no {periodoCorrespondente.numero}º período
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Documento de Concessão *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
                {arquivo && <p className="text-xs text-green-600 mt-1">Selecionado: {arquivo.name}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Observações</label>
                <textarea value={form.observacoes ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Observações sobre o período (opcional)" />
              </div>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <Button_M3 label="Cancelar" onClick={() => setShowForm(false)} bgColor="gray" type="button" />
              <Button_M3 label={saving ? 'Salvando...' : 'Registrar Férias'} onClick={handleSalvar} type="button" disabled={saving} />
            </div>
          </div>
        )}

        {ferias.length === 0 && !showForm ? (
          <div className="text-center py-8 text-gray-400 text-sm">Nenhum período de férias registrado.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2">Início</th>
                  <th className="px-3 py-2">Fim</th>
                  <th className="px-3 py-2 text-center">Dias</th>
                  <th className="px-3 py-2">Período CLT</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Documento</th>
                  <th className="px-3 py-2">Observações</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...ferias].reverse().map((f, rIdx) => {
                  const idx = ferias.length - 1 - rIdx;
                  const statusGozado = getStatusGozado(f);
                  const periodoCorrespondente = dataAdmissao
                    ? periodos.find(p => {
                        if (p.status === 'em_aquisicao' || !f.dataInicio) return false;
                        const ini = new Date(f.dataInicio + 'T12:00:00');
                        return ini >= p.iniConcessivo && ini <= p.fimConcessivo;
                      })
                    : undefined;
                  return (
                    <tr key={rIdx} className={`hover:bg-gray-50 ${statusGozado === 'andamento' ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDateBR(f.dataInicio)}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDateBR(f.dataFim)}</td>
                      <td className="px-3 py-2 text-gray-600 text-center">{f.diasGozados ?? calcDias(f.dataInicio, f.dataFim)}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {periodoCorrespondente
                          ? `${periodoCorrespondente.numero}º período`
                          : <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {statusGozado === 'andamento' && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Em andamento</span>
                        )}
                        {statusGozado === 'agendado' && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Agendado</span>
                        )}
                        {statusGozado === 'encerrado' && (
                          <span className="text-xs text-gray-400">Encerrado</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {f.arquivoUrl ? (
                          <a href={f.arquivoUrl} target="_blank" rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-xs underline">
                            Ver arquivo
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs max-w-[160px] truncate">{f.observacoes || '—'}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete(idx)} className="text-red-500 hover:text-red-700 text-xs">Remover</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab_Ferias;
