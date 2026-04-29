import React from 'react';
import { T_Equipe } from '@/types/T_escala';
import { T_EscalaExcecao } from '@/types/T_escalaExcecao';
import { isWorkingDay, equipeEmDia, formatDateISO } from '@/utils/escalaUtils';

const DIAS_LABEL = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

interface Props {
  equipes: T_Equipe[];
  semana: Date[];
  filtroEquipeId: string;
  excecoes: T_EscalaExcecao[];
  onClickDia: (data: string) => void;
}

const EXCECAO_STYLE = {
  falta: { bg: '#fee2e2', border: '#fca5a5', icon: '✕', title: 'Falta' },
  troca: { bg: '#fef9c3', border: '#fde047', icon: '⇄', title: 'Troca' },
  extra: { bg: '#dcfce7', border: '#86efac', icon: '+', title: 'Extra'  },
};

export default function EscalaGrade({ equipes, semana, filtroEquipeId, excecoes, onClickDia }: Props) {
  const equipesVisiveis = (filtroEquipeId
    ? equipes.filter((e) => e._id === filtroEquipeId && e.ativo)
    : equipes.filter((e) => e.ativo)
  ).filter((eq) => semana.some((d) => equipeEmDia(eq, d)));

  if (equipesVisiveis.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Nenhuma equipe escalada nesta semana.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm border-collapse" style={{ minWidth: 640 }}>
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 text-left font-semibold" style={{ width: 200 }}>Colaborador</th>
            {semana.map((dia, i) => {
              const iso = formatDateISO(dia);
              const hoje = formatDateISO(new Date());
              return (
                <th
                  key={i}
                  className={`px-2 py-3 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors ${iso === hoje ? 'bg-indigo-50' : ''}`}
                  onClick={() => onClickDia(iso)}
                  style={{ width: 60 }}
                >
                  <div className={iso === hoje ? 'text-indigo-600' : ''}>{DIAS_LABEL[i]}</div>
                  <div className={`font-normal ${iso === hoje ? 'text-indigo-400' : 'text-gray-400'}`}>
                    {dia.getDate().toString().padStart(2, '0')}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {equipesVisiveis.map((equipe) => {
            // Extras adicionados (não estão em equipe.membros)
            const extrasEquipeSemana = excecoes.filter(
              (e) => e.equipeId === equipe._id && e.tipo === 'extra' &&
                semana.some((d) => formatDateISO(d) === e.data)
            );
            const extrasIds = new Set(extrasEquipeSemana.map((e) => e.funcionarioId));

            const membrosParaExibir = [
              ...equipe.membros,
              // membros extras que não estão no time
              ...extrasEquipeSemana
                .filter((e, i, arr) => arr.findIndex((x) => x.funcionarioId === e.funcionarioId) === i)
                .filter((e) => !equipe.membros.some((m) => m.funcionarioId === e.funcionarioId))
                .map((e) => ({ funcionarioId: e.funcionarioId, nome: e.nome, dataReferencia: undefined, tipo: 'extra' as const })),
            ];

            return (
              <React.Fragment key={equipe._id}>
                {/* Team separator row */}
                <tr>
                  <td
                    colSpan={semana.length + 1}
                    className="px-4 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: equipe.cor }}
                  >
                    {equipe.nome} · {equipe.regra.horarioEntrada}–{equipe.regra.horarioSaida}
                  </td>
                </tr>

                {membrosParaExibir.length === 0 ? (
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 text-xs text-gray-400 italic">Sem membros cadastrados</td>
                    {semana.map((_, i) => <td key={i} />)}
                  </tr>
                ) : (
                  membrosParaExibir.map((membro, idx) => {
                    const isExtraMembro = extrasIds.has(membro.funcionarioId);
                    return (
                      <tr
                        key={membro.funcionarioId}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                      >
                        <td className="px-4 py-2 text-gray-800 truncate" style={{ maxWidth: 200 }}>
                          <span className="text-sm font-medium">{membro.nome}</span>
                          {isExtraMembro && (
                            <span className="ml-2 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              extra
                            </span>
                          )}
                        </td>
                        {semana.map((dia) => {
                          const iso = formatDateISO(dia);
                          const exc = excecoes.find(
                            (e) => e.equipeId === equipe._id && e.funcionarioId === membro.funcionarioId && e.data === iso
                          );
                          const scheduled = isExtraMembro
                            ? !!excecoes.find((e) => e.funcionarioId === membro.funcionarioId && e.data === iso && e.tipo === 'extra')
                            : isWorkingDay(membro as any, equipe.regra, dia);

                          let cell: React.ReactNode;
                          if (exc && exc.tipo !== 'extra') {
                            const s = EXCECAO_STYLE[exc.tipo];
                            cell = (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto cursor-pointer"
                                style={{ backgroundColor: s.bg, border: `1.5px solid ${s.border}`, color: s.border }}
                                title={`${s.title}${exc.observacao ? ` — ${exc.observacao}` : ''}`}
                                onClick={() => onClickDia(iso)}
                              >
                                {s.icon}
                              </div>
                            );
                          } else if (scheduled) {
                            const isExtra = exc?.tipo === 'extra' || isExtraMembro;
                            cell = (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: isExtra ? '#16a34a' : equipe.cor, outline: isExtra ? `2px solid #16a34a` : undefined, outlineOffset: 2 }}
                                title={`Escalado${isExtra ? ' (extra)' : ''} — ${equipe.regra.horarioEntrada}–${equipe.regra.horarioSaida}`}
                                onClick={() => onClickDia(iso)}
                              >
                                ✓
                              </div>
                            );
                          } else {
                            cell = (
                              <div
                                className="w-7 h-7 rounded-full bg-gray-100 mx-auto cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={() => onClickDia(iso)}
                              />
                            );
                          }

                          return (
                            <td key={iso} className="px-2 py-2 text-center">
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
