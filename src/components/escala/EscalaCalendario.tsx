import React from 'react';
import { T_Equipe } from '@/types/T_escala';
import { T_EscalaExcecao } from '@/types/T_escalaExcecao';
import { equipesEmDia, iniciaisNome, diasDoMes, formatDateISO } from '@/utils/escalaUtils';

const DIAS_LABEL = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

interface Props {
  equipes: T_Equipe[];
  ano: number;
  mes: number;
  filtroEquipeId: string;
  excecoes: T_EscalaExcecao[];
  onClickDia: (data: string) => void;
}

const EXCECAO_RING: Record<string, string> = {
  falta: 'ring-2 ring-red-400 opacity-50',
  troca: 'ring-2 ring-yellow-400',
  extra: 'ring-2 ring-green-400',
};

export default function EscalaCalendario({
  equipes, ano, mes, filtroEquipeId, excecoes, onClickDia,
}: Props) {
  const equipesVisiveis = filtroEquipeId
    ? equipes.filter((e) => e._id === filtroEquipeId && e.ativo)
    : equipes.filter((e) => e.ativo);

  const dias = diasDoMes(ano, mes);
  const primeiroDow = dias[0].getDay();
  const offset = (primeiroDow + 6) % 7;
  const padded: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...dias,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) semanas.push(padded.slice(i, i + 7));

  const hoje = formatDateISO(new Date());

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {DIAS_LABEL.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
        ))}
      </div>

      <div>
        {semanas.map((semana, si) => (
          <div key={si} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
            {semana.map((dia, di) => {
              if (!dia) {
                return <div key={di} className="bg-gray-50/50 min-h-[88px] border-r border-gray-100 last:border-r-0" />;
              }

              const iso = formatDateISO(dia);
              const entradas = equipesEmDia(equipesVisiveis, dia);
              const excDia = excecoes.filter((e) => e.data === iso);
              const ehHoje = iso === hoje;

              return (
                <div
                  key={di}
                  className={`min-h-[88px] border-r border-gray-100 last:border-r-0 p-1.5 cursor-pointer hover:bg-indigo-50/30 transition-colors ${ehHoje ? 'bg-indigo-50/60' : 'bg-white'}`}
                  onClick={() => onClickDia(iso)}
                >
                  <div className="flex justify-end mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                      ${ehHoje ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                      {dia.getDate()}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {entradas.map(({ equipe, membros }) => {
                      const extrasEquipe = excDia.filter((e) => e.equipeId === equipe._id && e.tipo === 'extra');
                      const membrosVisiveis = [
                        ...membros,
                        ...extrasEquipe.filter((e) => !membros.some((m) => m.funcionarioId === e.funcionarioId))
                          .map((e) => ({ funcionarioId: e.funcionarioId, nome: e.nome, tipo: 'extra' as const })),
                      ];

                      return (
                        <div
                          key={equipe._id}
                          className="rounded px-1.5 py-0.5"
                          style={{ backgroundColor: equipe.cor + '22', borderLeft: `3px solid ${equipe.cor}` }}
                        >
                          <p className="text-[10px] font-semibold truncate leading-tight" style={{ color: equipe.cor }}>
                            {equipe.nome}
                          </p>

                          {membrosVisiveis.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {membrosVisiveis.slice(0, 4).map((m, i) => {
                                const exc = excDia.find((e) => e.equipeId === equipe._id && e.funcionarioId === m.funcionarioId);
                                const ringClass = exc && exc.tipo !== 'extra' ? EXCECAO_RING[exc.tipo] : '';
                                return (
                                  <div
                                    key={i}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${ringClass}`}
                                    style={{ backgroundColor: (m as any).tipo === 'extra' ? '#16a34a' : equipe.cor }}
                                    title={exc ? `${exc.tipo}${exc.observacao ? ` — ${exc.observacao}` : ''}` : m.nome}
                                  >
                                    {exc && exc.tipo === 'falta' ? '✕' : iniciaisNome(m.nome)}
                                  </div>
                                );
                              })}
                              {membrosVisiveis.length > 4 && (
                                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[8px] text-gray-600 font-bold">
                                  +{membrosVisiveis.length - 4}
                                </div>
                              )}
                            </div>
                          )}

                          {membrosVisiveis.length === 0 && (
                            <p className="text-[9px] text-gray-400 leading-tight">Sem membros</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
