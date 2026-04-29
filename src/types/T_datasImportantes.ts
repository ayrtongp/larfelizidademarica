export type T_DataImportanteCat =
  | 'feriado_nacional'
  | 'feriado_estadual'
  | 'feriado_municipal'
  | 'ponto_facultativo'
  | 'feriado_local'
  | 'data_comemorativa'
  | 'evento_institucional'
  | 'religioso'
  | 'outro';

export const DATA_IMPORTANTE_CAT_LABELS: Record<T_DataImportanteCat, string> = {
  feriado_nacional:     'Feriado Nacional',
  feriado_estadual:     'Feriado Estadual',
  feriado_municipal:    'Feriado Municipal',
  ponto_facultativo:    'Ponto Facultativo',
  feriado_local:        'Feriado Local',
  data_comemorativa:    'Data Comemorativa',
  evento_institucional: 'Evento Institucional',
  religioso:            'Religioso',
  outro:                'Outro',
};

export const DATA_IMPORTANTE_CAT_COLORS: Record<T_DataImportanteCat, string> = {
  feriado_nacional:     'bg-red-100 text-red-700',
  feriado_estadual:     'bg-orange-100 text-orange-700',
  feriado_municipal:    'bg-amber-100 text-amber-700',
  ponto_facultativo:    'bg-sky-100 text-sky-700',
  feriado_local:        'bg-orange-100 text-orange-700',
  data_comemorativa:    'bg-pink-100 text-pink-700',
  evento_institucional: 'bg-indigo-100 text-indigo-700',
  religioso:            'bg-yellow-100 text-yellow-700',
  outro:                'bg-gray-100 text-gray-600',
};

export interface T_DataImportante {
  _id?: string;
  titulo: string;
  data: string;        // YYYY-MM-DD (recorrente=false) ou YYYY-MM-DD com ano ignorado (recorrente=true)
  recorrente: boolean; // true = repete todo ano
  categoria: T_DataImportanteCat;
  horario?: string;    // HH:MM
  observacao?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Converte T_DataImportante para o formato dd/mm/yyyy usado no CalendarioM1 */
export function datasImportantesToEventos(
  items: T_DataImportante[],
  anoRef: number = new Date().getFullYear(),
): { data: string; titulo: string; horario?: string; observacao?: string; categoria?: 'data_importante' }[] {
  return items
    .filter(item => item.data && item.data.includes('-'))
    .map(item => {
      const parts = item.data.split('-');
      if (parts.length < 3) return null;
      const [anoOriginal, mes, dia] = parts;
      if (!dia || !mes) return null;
      const ano = item.recorrente ? String(anoRef) : anoOriginal;
      return {
        data: `${dia}/${mes}/${ano}`,
        titulo: item.titulo,
        horario: item.horario,
        observacao: item.observacao,
        categoria: 'data_importante' as const,
      };
    })
    .filter(Boolean) as { data: string; titulo: string; horario?: string; observacao?: string; categoria?: 'data_importante' }[];
}

/** Ordena por mês/dia (ignora ano) para exibição no admin */
export function sortDatasImportantes(items: T_DataImportante[]): T_DataImportante[] {
  return [...items].sort((a, b) => {
    const [, aMes, aDia] = a.data.split('-');
    const [, bMes, bDia] = b.data.split('-');
    return (Number(aMes) * 100 + Number(aDia)) - (Number(bMes) * 100 + Number(bDia));
  });
}
