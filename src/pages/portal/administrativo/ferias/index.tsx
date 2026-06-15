import React, { useEffect, useMemo, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { T_FuncionarioCLTComUsuario } from '@/types/T_funcionariosCLT';
import { calcularPeriodos, piorStatus, STATUS_CFG, StatusPeriodo, PeriodoCLT } from '@/utils/calculoFerias';
import Link from 'next/link';
import { FaUmbrellaBeach } from 'react-icons/fa';

type Filtro = 'todos' | StatusPeriodo;

interface LinhaFuncionario {
  funcionario: T_FuncionarioCLTComUsuario;
  periodos: PeriodoCLT[];
  pior: StatusPeriodo;
  diasVencidos: number;
  diasDisponiveis: number;
  periodosCriticos: PeriodoCLT[];
}

function formatDateBR(dateStr?: string) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmt(date: Date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos',       label: 'Todos' },
  { value: 'vencido',     label: 'Vencidos ⚠' },
  { value: 'atencao',     label: 'Atenção' },
  { value: 'disponivel',  label: 'Disponíveis' },
  { value: 'em_aquisicao', label: 'Em aquisição' },
];

export default function MonitoramentoFerias() {
  const [funcionarios, setFuncionarios] = useState<T_FuncionarioCLTComUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    S_funcionariosCLT.getAll()
      .then(setFuncionarios)
      .finally(() => setLoading(false));
  }, []);

  const linhas: LinhaFuncionario[] = useMemo(() => {
    return funcionarios
      .filter(f => f.contrato?.dataAdmissao)
      .map(f => {
        const periodos = calcularPeriodos(f.contrato.dataAdmissao!, f.ferias ?? []);
        const pior = piorStatus(periodos);
        const diasVencidos = periodos
          .filter(p => p.status === 'vencido')
          .reduce((acc, p) => acc + Math.max(0, 30 - p.diasGozados), 0);
        const diasDisponiveis = periodos
          .filter(p => p.status === 'disponivel' || p.status === 'atencao')
          .reduce((acc, p) => acc + Math.max(0, p.diasDireito - p.diasGozados), 0);
        const periodosCriticos = periodos.filter(p => p.status === 'vencido' || p.status === 'atencao');
        return { funcionario: f, periodos, pior, diasVencidos, diasDisponiveis, periodosCriticos };
      })
      .sort((a, b) => {
        const prioridade: Record<StatusPeriodo, number> = { vencido: 0, atencao: 1, disponivel: 2, em_aquisicao: 3, concluido: 4 };
        return prioridade[a.pior] - prioridade[b.pior];
      });
  }, [funcionarios]);

  const linhasFiltradas = useMemo(() => {
    return linhas.filter(l => {
      const nome = `${l.funcionario.usuario?.nome ?? ''} ${l.funcionario.usuario?.sobrenome ?? ''}`.toLowerCase();
      const cargo = (l.funcionario.contrato?.cargo ?? '').toLowerCase();
      const matchBusca = !busca || nome.includes(busca.toLowerCase()) || cargo.includes(busca.toLowerCase());
      const matchFiltro = filtro === 'todos' || l.pior === filtro;
      return matchBusca && matchFiltro;
    });
  }, [linhas, filtro, busca]);

  const contagens = useMemo(() => ({
    vencido:      linhas.filter(l => l.pior === 'vencido').length,
    atencao:      linhas.filter(l => l.pior === 'atencao').length,
    disponivel:   linhas.filter(l => l.pior === 'disponivel').length,
    em_aquisicao: linhas.filter(l => l.pior === 'em_aquisicao').length,
    concluido:    linhas.filter(l => l.pior === 'concluido').length,
  }), [linhas]);

  return (
    <PermissionWrapper href="/portal" groups={['rh']}>
      <PortalBase>
        <div className="col-span-full space-y-4">

          {/* Header */}
          <div className="flex items-center gap-3">
            <FaUmbrellaBeach className="text-sky-500 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-700">Monitoramento de Férias</h1>
              <p className="text-xs text-gray-400">Visão consolidada dos períodos CLT de todos os funcionários</p>
            </div>
          </div>

          {/* Cards de resumo */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard label="Vencidos" value={contagens.vencido} color="text-red-600" bg="bg-red-50 border-red-200" />
              <SummaryCard label="Atenção (≤60 dias)" value={contagens.atencao} color="text-yellow-700" bg="bg-yellow-50 border-yellow-200" />
              <SummaryCard label="Disponíveis" value={contagens.disponivel} color="text-green-700" bg="bg-green-50 border-green-200" />
              <SummaryCard label="Em aquisição" value={contagens.em_aquisicao} color="text-gray-600" bg="bg-gray-50 border-gray-200" />
            </div>
          )}

          {/* Filtros + busca */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {FILTROS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFiltro(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border
                    ${filtro === f.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                >
                  {f.label}
                  {f.value !== 'todos' && contagens[f.value as StatusPeriodo] > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold
                      ${filtro === f.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {contagens[f.value as StatusPeriodo]}
                    </span>
                  )}
                </button>
              ))}
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome ou cargo..."
                className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-64"
              />
            </div>

            {/* Tabela */}
            {loading ? (
              <p className="text-sm text-gray-400 py-6 text-center">Carregando...</p>
            ) : linhasFiltradas.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                Nenhum funcionário encontrado para o filtro selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Funcionário</th>
                      <th className="px-4 py-2.5 text-left font-medium">Admissão</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status geral</th>
                      <th className="px-4 py-2.5 text-center font-medium">Dias disponíveis</th>
                      <th className="px-4 py-2.5 text-center font-medium">Dias vencidos</th>
                      <th className="px-4 py-2.5 text-left font-medium">Período crítico</th>
                      <th className="px-4 py-2.5 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {linhasFiltradas.map(({ funcionario: f, pior, diasVencidos, diasDisponiveis, periodosCriticos }) => {
                      const nome = `${f.usuario?.nome ?? ''} ${f.usuario?.sobrenome ?? ''}`.trim();
                      const foto = f.usuario?.foto_cdn || f.usuario?.foto_base64;
                      const cfg = STATUS_CFG[pior];
                      const criticoPeriodo = periodosCriticos[0];
                      return (
                        <tr key={f._id} className={`hover:bg-gray-50 ${pior === 'vencido' ? 'bg-red-50/40' : pior === 'atencao' ? 'bg-yellow-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {foto ? (
                                <img src={foto} className="w-8 h-8 rounded-full object-cover shrink-0" alt={nome} />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                                  {nome.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800 leading-tight">{nome}</p>
                                <p className="text-xs text-gray-400">{f.contrato?.cargo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {formatDateBR(f.contrato?.dataAdmissao)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${diasDisponiveis > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                              {diasDisponiveis || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${diasVencidos > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {diasVencidos || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {criticoPeriodo ? (
                              <div>
                                <span className="font-medium text-gray-700">{criticoPeriodo.numero}º período</span>
                                {criticoPeriodo.status === 'vencido' && (
                                  <p className="text-red-500">Venceu em {fmt(criticoPeriodo.fimConcessivo)}</p>
                                )}
                                {criticoPeriodo.status === 'atencao' && criticoPeriodo.diasAteVencer !== undefined && (
                                  <p className="text-yellow-600">Vence em {fmt(criticoPeriodo.fimConcessivo)} ({criticoPeriodo.diasAteVencer}d)</p>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/portal/administrativo/funcionarios/${f._id}`}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium whitespace-nowrap"
                            >
                              Ver funcionário →
                            </Link>
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
      </PortalBase>
    </PermissionWrapper>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
