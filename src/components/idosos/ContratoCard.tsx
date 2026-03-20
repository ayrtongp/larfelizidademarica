import React, { useState } from 'react';
import { T_ContratoIdoso, MODALIDADE_LABELS, BILLING_LABELS } from '@/types/T_contratosIdoso';
import S_contratosIdoso from '@/services/S_contratosIdoso';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { getUserID } from '@/utils/Login';

interface Props {
  contrato: T_ContratoIdoso;
  onUpdate: (updated: T_ContratoIdoso) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo:     { label: 'Ativo',     className: 'bg-green-100 text-green-800' },
  encerrado: { label: 'Encerrado', className: 'bg-gray-200 text-gray-600' },
  suspenso:  { label: 'Suspenso',  className: 'bg-yellow-100 text-yellow-800' },
};

const ContratoCard: React.FC<Props> = ({ contrato, onUpdate }) => {
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [loadingCobranca, setLoadingCobranca] = useState(false);

  const statusInfo = statusConfig[contrato.status] ?? { label: contrato.status, className: 'bg-gray-100' };

  const valorFinal = () => {
    if (contrato.tipoBilling === 'contrato_fechado' && contrato.contratado) {
      const descontos = (contrato.contratado.descontos ?? []).reduce((s, d) => s + d.valor, 0);
      const extras = (contrato.contratado.taxasExtras ?? []).reduce((s, t) => s + t.valor, 0);
      return contrato.contratado.valorMensalBase - descontos + extras;
    }
    if (contrato.tipoBilling === 'pacote_avulso' && contrato.pacote) {
      return contrato.pacote.diasUtilizados * contrato.pacote.valorPorDia;
    }
    if (contrato.tipoBilling === 'avulso' && contrato.avulso) {
      return contrato.avulso.valorDiaria;
    }
    return 0;
  };

  const handleCheckin = async () => {
    if (!contrato._id) return;
    try {
      setLoadingCheckin(true);
      await S_contratosIdoso.addCheckin(contrato._id);
      onUpdate({
        ...contrato,
        pacote: contrato.pacote ? { ...contrato.pacote, diasUtilizados: contrato.pacote.diasUtilizados + 1 } : contrato.pacote,
      });
      notifySuccess('Check-in registrado!');
    } catch {
      notifyError('Erro ao registrar check-in.');
    } finally {
      setLoadingCheckin(false);
    }
  };

  const handleGerarCobranca = async () => {
    if (!contrato._id) return;
    const competencia = prompt('Competência (YYYY-MM):');
    if (!competencia || !/^\d{4}-\d{2}$/.test(competencia)) {
      notifyError('Formato inválido. Use YYYY-MM.');
      return;
    }
    try {
      setLoadingCobranca(true);
      const result = await S_contratosIdoso.gerarCobranca({
        contratoId: contrato._id,
        competencia,
        createdBy: getUserID(),
      });
      notifySuccess(`Cobrança gerada: ${result.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    } catch {
      notifyError('Erro ao gerar cobrança.');
    } finally {
      setLoadingCobranca(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {MODALIDADE_LABELS[contrato.modalidade] ?? contrato.modalidade}
            <span className="ml-2 text-gray-400 font-normal">•</span>
            <span className="ml-2 text-gray-600 font-normal">{BILLING_LABELS[contrato.tipoBilling] ?? contrato.tipoBilling}</span>
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Detalhes billing */}
      {contrato.tipoBilling === 'contrato_fechado' && contrato.contratado && (
        <div className="text-sm text-gray-600">
          <p>Valor base: <strong className="text-gray-800">{contrato.contratado.valorMensalBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</strong></p>
          {(contrato.contratado.descontos?.length ?? 0) > 0 && (
            <p className="text-green-700">Descontos: -{(contrato.contratado.descontos ?? []).reduce((s, d) => s + d.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          )}
          {(contrato.contratado.taxasExtras?.length ?? 0) > 0 && (
            <p className="text-red-600">Extras: +{(contrato.contratado.taxasExtras ?? []).reduce((s, t) => s + t.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          )}
          <p className="font-semibold text-gray-800 mt-1">Total: {valorFinal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • Vence dia {contrato.contratado.diaVencimento}</p>
        </div>
      )}

      {contrato.tipoBilling === 'pacote_avulso' && contrato.pacote && (
        <div className="text-sm text-gray-600">
          <p>Pacote: <strong>{contrato.pacote.diasUtilizados}</strong> / {contrato.pacote.totalDias} dias utilizados</p>
          <p>{contrato.pacote.valorPorDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / dia</p>
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-500 h-1.5 rounded-full"
              style={{ width: `${Math.min((contrato.pacote.diasUtilizados / contrato.pacote.totalDias) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {contrato.tipoBilling === 'avulso' && contrato.avulso && (
        <p className="text-sm text-gray-600">Diária: <strong>{contrato.avulso.valorDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
      )}

      {/* Ações */}
      {contrato.status === 'ativo' && (
        <div className="flex flex-wrap gap-2 pt-1">
          {contrato.tipoBilling === 'pacote_avulso' && contrato.pacote && contrato.pacote.diasUtilizados < contrato.pacote.totalDias && (
            <button
              onClick={handleCheckin}
              disabled={loadingCheckin}
              className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-100 disabled:opacity-50"
            >
              {loadingCheckin ? 'Registrando...' : 'Registrar Check-in'}
            </button>
          )}
          <button
            onClick={handleGerarCobranca}
            disabled={loadingCobranca}
            className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded hover:bg-green-100 disabled:opacity-50"
          >
            {loadingCobranca ? 'Gerando...' : 'Gerar Cobrança'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContratoCard;
