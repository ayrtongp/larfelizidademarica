import { EscalaMembro, EscalaRegra, T_Equipe } from '@/types/T_escala';

function diffDias(dataRef: string, date: Date): number {
  const ref = new Date(dataRef + 'T00:00:00');
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((d.getTime() - ref.getTime()) / 86400000);
}

export function isWorkingDay(membro: EscalaMembro, regra: EscalaRegra, date: Date): boolean {
  switch (regra.tipo) {
    case 'dias_semana':
      return (regra.diasSemana ?? []).includes(date.getDay());
    case 'alternado':
    case '12x36': {
      const ref = membro.dataReferencia ?? regra.dataReferencia;
      if (!ref) return false;
      const d = diffDias(ref, date);
      return d >= 0 && d % 2 === 0;
    }
    case '24x48': {
      const ref = membro.dataReferencia ?? regra.dataReferencia;
      if (!ref) return false;
      const d = diffDias(ref, date);
      return d >= 0 && d % 3 === 0;
    }
    default:
      return false;
  }
}

export function semanaDeData(date: Date): Date[] {
  const dow = date.getDay();
  const seg = new Date(date);
  seg.setDate(date.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(seg);
    d.setDate(seg.getDate() + i);
    return d;
  });
}

export function diasDoMes(ano: number, mes: number): Date[] {
  const dias: Date[] = [];
  const d = new Date(ano, mes - 1, 1);
  while (d.getMonth() === mes - 1) {
    dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

export function iniciaisNome(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function membrosEmDia(
  equipes: T_Equipe[],
  date: Date
): { equipe: T_Equipe; membro: EscalaMembro }[] {
  const result: { equipe: T_Equipe; membro: EscalaMembro }[] = [];
  for (const eq of equipes) {
    if (!eq.ativo) continue;
    for (const m of eq.membros) {
      if (isWorkingDay(m, eq.regra, date)) {
        result.push({ equipe: eq, membro: m });
      }
    }
  }
  return result;
}

export function equipeEmDia(equipe: T_Equipe, date: Date): boolean {
  // Usa a regra da equipe com dataReferencia de nível equipe
  const fakeMembro: EscalaMembro = {
    funcionarioId: '',
    nome: '',
    dataReferencia: equipe.regra.dataReferencia,
  };
  return isWorkingDay(fakeMembro, equipe.regra, date);
}

export interface EntradaCalendario {
  equipe: T_Equipe;
  membros: EscalaMembro[];
}

export function equipesEmDia(equipes: T_Equipe[], date: Date): EntradaCalendario[] {
  return equipes
    .filter((eq) => eq.ativo && equipeEmDia(eq, date))
    .map((eq) => ({
      equipe: eq,
      membros: eq.membros.filter((m) => isWorkingDay(m, eq.regra, date)),
    }));
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
