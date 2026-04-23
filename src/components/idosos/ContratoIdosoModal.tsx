import React, { useState } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';
import S_contratosIdoso from '@/services/S_contratosIdoso';
import { T_ContratoIdoso } from '@/types/T_contratosIdoso';
import { getUserID } from '@/utils/Login';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioId: string;
  idosoDetalhesId: string;
}

const MODALIDADES = [
  { value: 'residencia_fixa',       label: 'Residência Fixa' },
  { value: 'residencia_temporaria', label: 'Residência Temporária' },
  { value: 'centro_dia',            label: 'Centro Dia' },
  { value: 'hotelaria',             label: 'Hotelaria' },
];

const BILLING_TIPOS = [
  { value: 'contrato_fechado', label: 'Contrato Fechado (mensal)' },
  { value: 'pacote_avulso',    label: 'Pacote Avulso (dias)' },
  { value: 'avulso',           label: 'Avulso (diária)' },
];

const ContratoIdosoModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, usuarioId, idosoDetalhesId }) => {
  const [modalidade, setModalidade] = useState<T_ContratoIdoso['modalidade']>('residencia_fixa');
  const [tipoBilling, setTipoBilling] = useState<T_ContratoIdoso['tipoBilling']>('contrato_fechado');

  const [prazo, setPrazo] = useState('');
  const [tipoPrazo, setTipoPrazo] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [tipoPagamento, setTipoPagamento] = useState<'a_vencer' | 'vencido'>('a_vencer');

  // Contrato fechado
  const [valorMensalBase, setValorMensalBase] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('10');
  const [dataInicio, setDataInicio] = useState('');

  // Pacote avulso
  const [totalDias, setTotalDias] = useState('');
  const [valorPorDia, setValorPorDia] = useState('');

  // Avulso
  const [valorDiaria, setValorDiaria] = useState('');

  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const handleSalvar = async () => {
    setErro('');

    if (tipoBilling === 'contrato_fechado') {
      if (!valorMensalBase || isNaN(parseFloat(valorMensalBase))) { setErro('Valor mensal base inválido.'); return; }
      if (!diaVencimento || isNaN(parseInt(diaVencimento))) { setErro('Dia de vencimento inválido.'); return; }
      if (!dataInicio) { setErro('Data de início é obrigatória.'); return; }
    } else if (tipoBilling === 'pacote_avulso') {
      if (!totalDias || isNaN(parseInt(totalDias))) { setErro('Total de dias inválido.'); return; }
      if (!valorPorDia || isNaN(parseFloat(valorPorDia))) { setErro('Valor por dia inválido.'); return; }
    } else if (tipoBilling === 'avulso') {
      if (!valorDiaria || isNaN(parseFloat(valorDiaria))) { setErro('Valor da diária inválido.'); return; }
    }

    try {
      setSaving(true);
      await S_contratosIdoso.create({
        usuarioId,
        idosoDetalhesId,
        modalidade,
        tipoBilling,
        prazo: prazo ? parseInt(prazo) : undefined,
        tipoPrazo: prazo ? tipoPrazo : undefined,
        tipoPagamento,
        contratado: tipoBilling === 'contrato_fechado' ? {
          valorMensalBase: parseFloat(valorMensalBase.replace(',', '.')),
          diaVencimento: parseInt(diaVencimento),
          dataInicio,
        } : undefined,
        pacote: tipoBilling === 'pacote_avulso' ? {
          totalDias: parseInt(totalDias),
          valorPorDia: parseFloat(valorPorDia.replace(',', '.')),
        } : undefined,
        avulso: tipoBilling === 'avulso' ? {
          valorDiaria: parseFloat(valorDiaria.replace(',', '.')),
        } : undefined,
        createdBy: getUserID(),
      });
      onSuccess();
      onClose();
    } catch {
      setErro('Erro ao salvar contrato.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-xs text-gray-600 mb-1';

  return (
    <ModalPadrao isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Novo Contrato</h2>
      <p className="text-sm text-gray-500 mb-4">Configure a modalidade e o tipo de faturamento.</p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Modalidade *</label>
            <select value={modalidade} onChange={(e) => setModalidade(e.target.value as any)}
              className={inputClass}>
              {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo de Faturamento *</label>
            <select value={tipoBilling} onChange={(e) => setTipoBilling(e.target.value as any)}
              className={inputClass}>
              {BILLING_TIPOS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
        </div>

        {/* Prazo e tipo de pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
          <div className="sm:col-span-1">
            <label className={labelClass}>Prazo</label>
            <input
              type="number"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className={inputClass}
              min={1}
              placeholder="Ex: 12"
            />
          </div>
          <div>
            <label className={labelClass}>Unidade do prazo</label>
            <select value={tipoPrazo} onChange={(e) => setTipoPrazo(e.target.value as any)} className={inputClass}>
              <option value="dia">Dia(s)</option>
              <option value="mes">Mês/Meses</option>
              <option value="ano">Ano(s)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Vencimento</label>
            <select value={tipoPagamento} onChange={(e) => setTipoPagamento(e.target.value as any)} className={inputClass}>
              <option value="a_vencer">À vencer (paga para usar)</option>
              <option value="vencido">Vencido (usa para pagar)</option>
            </select>
          </div>
        </div>

        {/* Campos de contrato fechado */}
        {tipoBilling === 'contrato_fechado' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className={labelClass}>Valor Mensal Base (R$) *</label>
              <input type="text" value={valorMensalBase} onChange={(e) => setValorMensalBase(e.target.value)}
                className={inputClass} placeholder="Ex: 4500.00" />
            </div>
            <div>
              <label className={labelClass}>Dia de Vencimento *</label>
              <input type="number" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)}
                className={inputClass} min={1} max={31} />
            </div>
            <div>
              <label className={labelClass}>Data de Início *</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                className={inputClass} />
            </div>
          </div>
        )}

        {/* Campos de pacote avulso */}
        {tipoBilling === 'pacote_avulso' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className={labelClass}>Total de Dias *</label>
              <input type="number" value={totalDias} onChange={(e) => setTotalDias(e.target.value)}
                className={inputClass} min={1} placeholder="Ex: 20" />
            </div>
            <div>
              <label className={labelClass}>Valor por Dia (R$) *</label>
              <input type="text" value={valorPorDia} onChange={(e) => setValorPorDia(e.target.value)}
                className={inputClass} placeholder="Ex: 150.00" />
            </div>
          </div>
        )}

        {/* Campos de avulso */}
        {tipoBilling === 'avulso' && (
          <div className="pt-2 border-t">
            <label className={labelClass}>Valor da Diária (R$) *</label>
            <input type="text" value={valorDiaria} onChange={(e) => setValorDiaria(e.target.value)}
              className={inputClass} placeholder="Ex: 200.00" />
          </div>
        )}

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <div className="flex gap-2 justify-end">
          <Button_M3 label="Cancelar" onClick={onClose} bgColor="gray" type="button" />
          <Button_M3 label={saving ? 'Salvando...' : 'Criar Contrato'} onClick={handleSalvar} type="button" disabled={saving} />
        </div>
      </div>
    </ModalPadrao>
  );
};

export default ContratoIdosoModal;
