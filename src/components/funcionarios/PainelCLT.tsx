import React, { useState } from 'react';
import { T_FuncionarioCLTComUsuario } from '@/types/T_funcionariosCLT';
import DocPeriodoTab from '@/components/rh/DocPeriodoTab';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  demitido: { label: 'Demitido', className: 'bg-red-100 text-red-800' },
  afastado: { label: 'Afastado', className: 'bg-yellow-100 text-yellow-800' },
  ferias: { label: 'Férias', className: 'bg-blue-100 text-blue-800' },
};

const TURNO_LABELS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
  escala_12x36: '12x36',
  escala_24x48: '24x48',
};

const CONTRATO_LABELS: Record<string, string> = {
  experiencia: 'Experiência',
  prazo_indeterminado: 'Prazo Indeterminado',
  prazo_determinado: 'Prazo Determinado',
};

function formatDateBR(dateStr?: string) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Secao = 'resumo' | 'documentos';

interface Props {
  funcionario: T_FuncionarioCLTComUsuario;
}

export default function PainelCLT({ funcionario }: Props) {
  const [secao, setSecao] = useState<Secao>('resumo');
  const [docTipo, setDocTipo] = useState<'contracheque' | 'folha_ponto'>('contracheque');

  const nomeCompleto = funcionario.usuario
    ? `${funcionario.usuario.nome} ${funcionario.usuario.sobrenome}`.trim()
    : '';

  const statusInfo = STATUS_CONFIG[funcionario.status] ?? { label: funcionario.status, className: 'bg-gray-100 text-gray-700' };

  const beneficiosAtivos = [
    funcionario.beneficios?.valeTransporte && 'Vale Transporte',
    funcionario.beneficios?.valeAlimentacao && 'Vale Alimentação',
    funcionario.beneficios?.planoSaude && 'Plano de Saúde',
    funcionario.beneficios?.planoOdontologico && 'Odontológico',
    funcionario.beneficios?.seguroVida && 'Seguro de Vida',
  ].filter(Boolean) as string[];

  const hoje = new Date();
  const proximasFerias = (funcionario.ferias ?? [])
    .filter(f => f.dataInicio && new Date(f.dataInicio) >= hoje)
    .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());

  const feriasAndamento = (funcionario.ferias ?? []).find(f => {
    if (!f.dataInicio || !f.dataFim) return false;
    return new Date(f.dataInicio) <= hoje && hoje <= new Date(f.dataFim);
  });

  return (
    <div>
      {/* Nav de seções */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {([
          { id: 'resumo', label: 'Resumo' },
          { id: 'documentos', label: 'Documentos' },
        ] as { id: Secao; label: string }[]).map(s => (
          <button
            key={s.id}
            onClick={() => setSecao(s.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${secao === s.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* RESUMO */}
      {secao === 'resumo' && (
        <div className="space-y-5">

          {/* Status + contrato */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide">Contrato</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <InfoCard label="Cargo" value={funcionario.contrato?.cargo} />
              <InfoCard label="Setor" value={funcionario.contrato?.setor} />
              <InfoCard label="Admissão" value={formatDateBR(funcionario.contrato?.dataAdmissao)} />
              <InfoCard label="Salário Base" value={formatCurrency(funcionario.contrato?.salarioBase)} />
              <InfoCard label="Carga Horária" value={`${funcionario.contrato?.cargaHorariaSemanal}h/semana`} />
              <InfoCard label="Turno" value={TURNO_LABELS[funcionario.contrato?.turno ?? ''] ?? funcionario.contrato?.turno} />
              <InfoCard label="Tipo de Contrato" value={CONTRATO_LABELS[funcionario.contrato?.tipoContrato] ?? funcionario.contrato?.tipoContrato} />
              {funcionario.pisPasep && <InfoCard label="PIS/PASEP" value={funcionario.pisPasep} />}
            </div>
          </div>

          {/* Benefícios */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Benefícios ativos</p>
            {beneficiosAtivos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {beneficiosAtivos.map(b => (
                  <span key={b} className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">{b}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Nenhum benefício registrado.</p>
            )}
          </div>

          {/* Férias */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Férias</p>
            {feriasAndamento ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                Você está de férias: <strong>{formatDateBR(feriasAndamento.dataInicio)}</strong> a <strong>{formatDateBR(feriasAndamento.dataFim)}</strong>
                {feriasAndamento.diasGozados && <span className="ml-1">({feriasAndamento.diasGozados} dias)</span>}
              </div>
            ) : proximasFerias.length > 0 ? (
              <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-3 text-sm text-sky-800">
                Próximas férias agendadas: <strong>{formatDateBR(proximasFerias[0].dataInicio)}</strong> a <strong>{formatDateBR(proximasFerias[0].dataFim)}</strong>
                {proximasFerias[0].diasGozados && <span className="ml-1">({proximasFerias[0].diasGozados} dias)</span>}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Nenhum período de férias agendado.</p>
            )}
          </div>

        </div>
      )}

      {/* DOCUMENTOS */}
      {secao === 'documentos' && funcionario._id && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-1 mb-4">
            {([
              { id: 'contracheque', label: 'Contracheque' },
              { id: 'folha_ponto', label: 'Folha de Ponto' },
            ] as { id: 'contracheque' | 'folha_ponto'; label: string }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setDocTipo(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${docTipo === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <DocPeriodoTab
            funcionarioId={funcionario._id}
            funcionarioNome={nomeCompleto}
            tipo={docTipo}
            readonly
          />
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );
}
