import { TituloStatus } from '@/types/T_financeiroTitulos';

export function calculateTituloStatus(
  saldo: number,
  vencimento: string,
  cancelado?: boolean
): TituloStatus {
  if (cancelado) return 'cancelado';
  if (saldo <= 0) return 'liquidado';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVencimento = new Date(vencimento);
  dataVencimento.setHours(0, 0, 0, 0);

  if (dataVencimento < hoje) return 'vencido';

  return 'aberto';
}
