export type T_AgendaGeralTipo =
  | 'consulta'
  | 'exame'
  | 'reuniao'
  | 'visita'
  | 'retorno'
  | 'compromisso'
  | 'outro';

export type T_AgendaGeralOrigem =
  | 'familia'
  | 'equipe'
  | 'rh'
  | 'coordenacao'
  | 'outro';

export type T_AgendaGeralStatus =
  | 'agendado'
  | 'concluido'
  | 'cancelado';

export interface T_AgendaGeral {
  _id?: string;
  titulo: string;
  data: string;
  horario?: string;
  tipo: T_AgendaGeralTipo;
  origem: T_AgendaGeralOrigem;
  status: T_AgendaGeralStatus;
  residente_id?: string;
  usuario_id?: string;
  local?: string;
  informado_por?: string;
  descricao?: string;
  nomeResidente?: string;
  nomeUsuario?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const AGENDA_GERAL_TIPO_LABELS: Record<T_AgendaGeralTipo, string> = {
  consulta: 'Consulta',
  exame: 'Exame',
  reuniao: 'Reunião',
  visita: 'Visita',
  retorno: 'Retorno',
  compromisso: 'Compromisso',
  outro: 'Outro',
};

export const AGENDA_GERAL_ORIGEM_LABELS: Record<T_AgendaGeralOrigem, string> = {
  familia: 'Família',
  equipe: 'Equipe',
  rh: 'RH',
  coordenacao: 'Coordenação',
  outro: 'Outro',
};

export const AGENDA_GERAL_STATUS_LABELS: Record<T_AgendaGeralStatus, string> = {
  agendado: 'Agendado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

function isoToBr(isoDate: string): string {
  const [year, month, day] = String(isoDate || '').split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function agendaGeralToEventosCalendario(items: T_AgendaGeral[]) {
  return items
    .filter((item) => item.data)
    .map((item) => {
      const contexto = [
        item.nomeResidente ? `Residente: ${item.nomeResidente}` : '',
        item.nomeUsuario ? `Responsável: ${item.nomeUsuario}` : '',
        item.local ? `Local: ${item.local}` : '',
      ].filter(Boolean).join(' · ');

      return {
        data: isoToBr(item.data),
        titulo: `${AGENDA_GERAL_TIPO_LABELS[item.tipo]} · ${item.titulo}`,
        horario: item.horario || '',
        observacao: contexto || item.descricao || '',
        categoria: 'agenda' as const,
      };
    });
}
