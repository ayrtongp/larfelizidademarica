import { T_Ferias } from '@/types/T_funcionariosCLT';

export type StatusPeriodo = 'em_aquisicao' | 'disponivel' | 'atencao' | 'vencido' | 'concluido';

export interface PeriodoCLT {
  numero: number;
  iniAquisitivo: Date;
  fimAquisitivo: Date;
  iniConcessivo: Date;
  fimConcessivo: Date;
  diasDireito: number;
  diasGozados: number;
  status: StatusPeriodo;
  feriasDoPeriodo: T_Ferias[];
  progressPercent?: number;
  diasParaCompletar?: number;
  diasAteVencer?: number;
}

export const STATUS_CFG: Record<StatusPeriodo, { label: string; badge: string; row: string }> = {
  em_aquisicao: { label: 'Em aquisição', badge: 'bg-gray-100 text-gray-600',    row: '' },
  disponivel:   { label: 'Disponível',   badge: 'bg-green-100 text-green-800',  row: 'bg-green-50' },
  atencao:      { label: 'Atenção',      badge: 'bg-yellow-100 text-yellow-800', row: 'bg-yellow-50' },
  vencido:      { label: 'Vencido ⚠',   badge: 'bg-red-100 text-red-800',      row: 'bg-red-50' },
  concluido:    { label: 'Concluído',    badge: 'bg-blue-100 text-blue-700',    row: '' },
};

export function calcDias(ini?: string, fim?: string): number {
  if (!ini || !fim) return 0;
  const diff = Math.round((new Date(fim).getTime() - new Date(ini).getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

function addAnos(dateStr: string, anos: number): Date {
  const d = new Date(dateStr + 'T12:00:00');
  d.setFullYear(d.getFullYear() + anos);
  return d;
}

export function calcularPeriodos(dataAdmissao: string, ferias: T_Ferias[]): PeriodoCLT[] {
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
      const totalMs = fimAquisitivo.getTime() - iniAquisitivo.getTime();
      const doneMs = hoje.getTime() - iniAquisitivo.getTime();
      const progressPercent = Math.min(99, Math.round((doneMs / totalMs) * 100));
      const diasParaCompletar = Math.ceil((fimAquisitivo.getTime() - hoje.getTime()) / 86400000);
      periodos.push({
        numero: n, iniAquisitivo, fimAquisitivo, iniConcessivo, fimConcessivo,
        diasDireito: 0, diasGozados: 0, status: 'em_aquisicao',
        feriasDoPeriodo: [], progressPercent, diasParaCompletar,
      });
      break;
    }

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
      status = diasRestantes === 0 ? 'concluido' : diasAteVencer <= 60 ? 'atencao' : 'disponivel';
    }

    periodos.push({
      numero: n, iniAquisitivo, fimAquisitivo, iniConcessivo, fimConcessivo,
      diasDireito: 30, diasGozados, status, feriasDoPeriodo, diasAteVencer,
    });
  }

  return periodos;
}

const STATUS_PRIORIDADE: Record<StatusPeriodo, number> = {
  vencido: 0, atencao: 1, disponivel: 2, em_aquisicao: 3, concluido: 4,
};

export function piorStatus(periodos: PeriodoCLT[]): StatusPeriodo {
  if (!periodos.length) return 'em_aquisicao';
  return periodos.reduce((pior, p) =>
    STATUS_PRIORIDADE[p.status] < STATUS_PRIORIDADE[pior] ? p.status : pior,
    'concluido' as StatusPeriodo
  );
}
