import React, { useRef, useState } from 'react';
import { T_AvisoPrevio, T_DocumentoDemissao, T_FuncionarioCLT, T_TipoDemissao, T_TipoDocumentoDemissao } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { uploadArquivoPasta } from '@/actions/DO_UploadFile';
import { updateProfile } from '@/utils/Login';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_DEMISSAO: { value: T_TipoDemissao; label: string }[] = [
  { value: 'sem_justa_causa', label: 'Demissão Sem Justa Causa' },
  { value: 'com_justa_causa', label: 'Demissão Com Justa Causa' },
  { value: 'pedido_demissao', label: 'Pedido de Demissão' },
  { value: 'aposentadoria', label: 'Aposentadoria' },
  { value: 'falecimento', label: 'Falecimento' },
  { value: 'acordo', label: 'Acordo (art. 484-A CLT)' },
  { value: 'outro', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'afastado', label: 'Afastado' },
  { value: 'ferias', label: 'Férias' },
];

const TIPOS_AVISO: { value: T_AvisoPrevio['tipo']; label: string }[] = [
  { value: 'trabalhado', label: 'Trabalhado' },
  { value: 'indenizado', label: 'Indenizado' },
  { value: 'dispensado', label: 'Dispensado' },
];

// ─── Lógica de documentos obrigatórios ───────────────────────────────────────

type StatusDocumento = 'obrigatorio' | 'condicional' | 'opcional' | 'nao_aplicavel';

interface DefDocumento {
  tipo: T_TipoDocumentoDemissao;
  titulo: string;
  descricao: string;
  status: StatusDocumento;
}

function getDefDocumentos(
  tipoDemissao: T_TipoDemissao | undefined,
  avisoPrevio: T_AvisoPrevio | undefined,
): DefDocumento[] {
  const t = tipoDemissao ?? 'sem_justa_causa';
  const temAvisoPrevio = t !== 'com_justa_causa' && t !== 'acordo' && t !== 'falecimento';
  const precisaRecibo = temAvisoPrevio && avisoPrevio?.tipo !== 'dispensado';

  const aso: DefDocumento = {
    tipo: 'aso_demissional',
    titulo: 'ASO Demissional',
    descricao: 'Atestado de Saúde Ocupacional — exame médico demissional obrigatório por lei.',
    status: t === 'falecimento' ? 'nao_aplicavel' : 'obrigatorio',
  };

  const aviso: DefDocumento = {
    tipo: 'aviso_previo',
    titulo: 'Recibo de Aviso Prévio',
    descricao: 'Recibo assinado pelo empregado referente ao aviso prévio trabalhado ou indenizado.',
    status: !temAvisoPrevio
      ? 'nao_aplicavel'
      : precisaRecibo
      ? 'condicional'
      : 'nao_aplicavel',
  };

  const trct: DefDocumento = {
    tipo: 'termo_rescisao',
    titulo: 'Termo de Rescisão (TRCT)',
    descricao: 'Termo de Rescisão do Contrato de Trabalho assinado pelas partes.',
    status: 'obrigatorio',
  };

  const comp: DefDocumento = {
    tipo: 'comprovante_pagamento',
    titulo: 'Comprovante de Pagamento',
    descricao: 'Comprovante do pagamento das verbas rescisórias.',
    status: t === 'falecimento' ? 'opcional' : 'obrigatorio',
  };

  return [aso, aviso, trct, comp].filter(d => d.status !== 'nao_aplicavel');
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function formatDateBR(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function badgeStatus(s: StatusDocumento) {
  if (s === 'obrigatorio') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Obrigatório</span>;
  if (s === 'condicional') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Obrigatório</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Opcional</span>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  funcionarioId: string;
  funcionarioNome: string;
  status: T_FuncionarioCLT['status'];
  dataDemissao?: string;
  tipoDemissao?: T_TipoDemissao;
  motivoDemissao?: string;
  avisoPrevio?: T_AvisoPrevio;
  documentosDemissao?: T_DocumentoDemissao[];
  onUpdate: (data: Partial<T_FuncionarioCLT>) => void;
}

// ─── Componente de card de documento ─────────────────────────────────────────

interface DocCardProps {
  def: DefDocumento;
  doc?: T_DocumentoDemissao;
  funcionarioId: string;
  onAdded: (doc: T_DocumentoDemissao) => void;
  onRemoved: (cloudFilename: string) => void;
}

function DocCard({ def, doc, funcionarioId, onAdded, onRemoved }: DocCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const profile = updateProfile();
      const nomeUsuario = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
      const result = await uploadArquivoPasta(file, `funcionarios_clt/${funcionarioId}/demissao`, nomeUsuario);
      if (!result) throw new Error('Upload falhou');
      const novoDoc: T_DocumentoDemissao = {
        tipo: def.tipo,
        cloudURL: result.cloudURL,
        filename: result.filename,
        cloudFilename: result.cloudFilename,
        size: result.size,
        format: result.format,
        uploadedAt: new Date().toISOString(),
        uploadedBy: profile?._id ?? '',
        uploadedByNome: nomeUsuario,
      };
      await S_funcionariosCLT.addDocumentoDemissao(funcionarioId, novoDoc);
      onAdded(novoDoc);
      notifySuccess('Documento enviado!');
    } catch {
      notifyError('Erro ao enviar documento.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!doc || !confirm('Remover este documento?')) return;
    setRemoving(true);
    try {
      await S_funcionariosCLT.removeDocumentoDemissao(funcionarioId, doc.cloudFilename);
      onRemoved(doc.cloudFilename);
      notifySuccess('Documento removido.');
    } catch {
      notifyError('Erro ao remover documento.');
    } finally {
      setRemoving(false);
    }
  };

  const enviado = !!doc;

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
      enviado
        ? 'bg-green-50 border-green-200'
        : def.status === 'opcional'
        ? 'bg-gray-50 border-gray-200'
        : 'bg-white border-red-200'
    }`}>
      {/* Ícone de status */}
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        enviado ? 'bg-green-500' : def.status === 'opcional' ? 'bg-gray-200' : 'bg-red-400'
      }`}>
        {enviado ? (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-gray-800">{def.titulo}</span>
          {badgeStatus(def.status)}
        </div>

        {enviado ? (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <a href={doc.cloudURL} target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline truncate max-w-[220px]" title={doc.filename}>
              📎 {doc.filename}
            </a>
            <span className="text-[10px] text-gray-400">{formatDateBR(doc.uploadedAt?.slice(0,10))}</span>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors ml-auto"
            >
              {removing ? 'Removendo...' : 'Remover'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-0.5">{def.descricao}</p>
        )}
      </div>

      {/* Botão upload */}
      {!enviado && (
        <label className={`shrink-0 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          uploading
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
            : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
        }`}>
          {uploading ? 'Enviando...' : 'Enviar'}
          <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

// ─── Componente de card "Outros" ──────────────────────────────────────────────

interface OutrosCardProps {
  docs: T_DocumentoDemissao[];
  funcionarioId: string;
  onAdded: (doc: T_DocumentoDemissao) => void;
  onRemoved: (cloudFilename: string) => void;
}

function OutrosCard({ docs, funcionarioId, onAdded, onRemoved }: OutrosCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [descricao, setDescricao] = useState('');
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!descricao.trim()) { notifyError('Informe uma descrição antes de enviar.'); return; }
    setUploading(true);
    try {
      const profile = updateProfile();
      const nomeUsuario = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
      const result = await uploadArquivoPasta(file, `funcionarios_clt/${funcionarioId}/demissao`, nomeUsuario);
      if (!result) throw new Error('Upload falhou');
      const novoDoc: T_DocumentoDemissao = {
        tipo: 'outro',
        descricao: descricao.trim(),
        cloudURL: result.cloudURL,
        filename: result.filename,
        cloudFilename: result.cloudFilename,
        size: result.size,
        format: result.format,
        uploadedAt: new Date().toISOString(),
        uploadedBy: profile?._id ?? '',
        uploadedByNome: nomeUsuario,
      };
      await S_funcionariosCLT.addDocumentoDemissao(funcionarioId, novoDoc);
      onAdded(novoDoc);
      setDescricao('');
      notifySuccess('Documento enviado!');
    } catch {
      notifyError('Erro ao enviar documento.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (doc: T_DocumentoDemissao) => {
    if (!confirm('Remover este documento?')) return;
    setRemoving(doc.cloudFilename);
    try {
      await S_funcionariosCLT.removeDocumentoDemissao(funcionarioId, doc.cloudFilename);
      onRemoved(doc.cloudFilename);
      notifySuccess('Documento removido.');
    } catch {
      notifyError('Erro ao remover documento.');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="p-3.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 space-y-2">
      <p className="text-sm font-semibold text-gray-700">Outros documentos <span className="text-[10px] font-normal text-gray-400">(opcional)</span></p>

      {docs.map(doc => (
        <div key={doc.cloudFilename} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
          <a href={doc.cloudURL} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline flex-1 truncate" title={doc.filename}>
            📎 {doc.descricao || doc.filename}
          </a>
          <span className="text-[10px] text-gray-400 shrink-0">{doc.filename}</span>
          <button
            onClick={() => handleRemove(doc)}
            disabled={removing === doc.cloudFilename}
            className="text-[10px] text-gray-400 hover:text-red-500 shrink-0"
          >
            {removing === doc.cloudFilename ? '...' : 'Remover'}
          </button>
        </div>
      ))}

      <div className="flex gap-2 items-center pt-1">
        <input
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Descrição do documento"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
        />
        <label className={`shrink-0 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          uploading
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
            : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
        }`}>
          {uploading ? 'Enviando...' : '+ Adicionar'}
          <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────

const Tab_Demissao: React.FC<Props> = ({
  funcionarioId,
  funcionarioNome,
  status,
  dataDemissao,
  tipoDemissao,
  motivoDemissao,
  avisoPrevio,
  documentosDemissao = [],
  onUpdate,
}) => {
  const [formStatus, setFormStatus] = useState<'ativo' | 'afastado' | 'ferias'>(
    status !== 'demitido' ? (status as 'ativo' | 'afastado' | 'ferias') : 'ativo'
  );
  const [formData, setFormData] = useState(dataDemissao ?? '');
  const [formTipo, setFormTipo] = useState<T_TipoDemissao>(tipoDemissao ?? 'sem_justa_causa');
  const [formMotivo, setFormMotivo] = useState(motivoDemissao ?? '');
  const [formAviso, setFormAviso] = useState<T_AvisoPrevio>({
    tipo: avisoPrevio?.tipo ?? 'trabalhado',
    dataInicio: avisoPrevio?.dataInicio ?? '',
    dataFim: avisoPrevio?.dataFim ?? '',
  });
  const [docs, setDocs] = useState<T_DocumentoDemissao[]>(documentosDemissao);
  const [saving, setSaving] = useState(false);

  const tiposComAviso: T_TipoDemissao[] = ['sem_justa_causa', 'pedido_demissao', 'aposentadoria'];
  const exibeAviso = tiposComAviso.includes(formTipo);

  const handleAlterarStatus = async () => {
    if (!confirm(`Confirmar alteração de status para "${STATUS_OPTIONS.find(s => s.value === formStatus)?.label}"?`)) return;
    try {
      setSaving(true);
      await S_funcionariosCLT.updateStatus(funcionarioId, formStatus);
      onUpdate({ status: formStatus });
      notifySuccess('Status atualizado!');
    } catch {
      notifyError('Erro ao atualizar status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDemitir = async () => {
    if (!formData) { notifyError('Data de demissão é obrigatória.'); return; }
    if (!formTipo) { notifyError('Tipo de demissão é obrigatório.'); return; }
    if (!confirm(`Confirmar demissão de ${funcionarioNome}? Esta ação é reversível pelo RH.`)) return;
    try {
      setSaving(true);
      const payload = {
        dataDemissao: formData,
        tipoDemissao: formTipo,
        motivoDemissao: formMotivo,
        ...(exibeAviso ? { avisoPrevio: formAviso } : {}),
      };
      await S_funcionariosCLT.demitir(funcionarioId, payload);
      onUpdate({ status: 'demitido', dataDemissao: formData, tipoDemissao: formTipo, motivoDemissao: formMotivo, avisoPrevio: exibeAviso ? formAviso : undefined });
      notifySuccess('Demissão registrada.');
    } catch {
      notifyError('Erro ao registrar demissão.');
    } finally {
      setSaving(false);
    }
  };

  const handleReativar = async () => {
    if (!confirm(`Reativar ${funcionarioNome}?`)) return;
    try {
      setSaving(true);
      await S_funcionariosCLT.reativar(funcionarioId);
      onUpdate({ status: 'ativo', dataDemissao: undefined, tipoDemissao: undefined, motivoDemissao: undefined, avisoPrevio: undefined, documentosDemissao: [] });
      notifySuccess('Funcionário reativado!');
    } catch {
      notifyError('Erro ao reativar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocAdded = (doc: T_DocumentoDemissao) => setDocs(prev => [...prev, doc]);
  const handleDocRemoved = (cloudFilename: string) => setDocs(prev => prev.filter(d => d.cloudFilename !== cloudFilename));

  // ── Vista: DEMITIDO ──────────────────────────────────────────────────────────

  if (status === 'demitido') {
    const defsDocumentos = getDefDocumentos(tipoDemissao, avisoPrevio);
    const obrigatoriosTotal = defsDocumentos.filter(d => d.status === 'obrigatorio' || d.status === 'condicional').length;
    const obrigatoriosEnviados = defsDocumentos.filter(d => {
      const enviado = docs.find(doc => doc.tipo === d.tipo);
      return enviado && (d.status === 'obrigatorio' || d.status === 'condicional');
    }).length;
    const outrosDocs = docs.filter(d => d.tipo === 'outro');
    const progresso = obrigatoriosTotal > 0 ? Math.round((obrigatoriosEnviados / obrigatoriosTotal) * 100) : 100;
    const completo = obrigatoriosEnviados === obrigatoriosTotal;

    const labelTipo = TIPOS_DEMISSAO.find(t => t.value === tipoDemissao)?.label ?? tipoDemissao ?? '—';
    const labelAviso = avisoPrevio ? TIPOS_AVISO.find(a => a.value === avisoPrevio.tipo)?.label : null;

    return (
      <div className="space-y-4">
        {/* Card de resumo */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Funcionário Demitido</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Data</p>
                  <p className="font-semibold text-gray-800">{formatDateBR(dataDemissao)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Tipo</p>
                  <p className="font-semibold text-gray-800">{labelTipo}</p>
                </div>
                {labelAviso && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Aviso Prévio</p>
                    <p className="font-semibold text-gray-800">
                      {labelAviso}
                      {avisoPrevio?.dataInicio && ` · ${formatDateBR(avisoPrevio.dataInicio)}`}
                      {avisoPrevio?.dataFim && ` → ${formatDateBR(avisoPrevio.dataFim)}`}
                    </p>
                  </div>
                )}
                {motivoDemissao && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Motivo</p>
                    <p className="font-medium text-gray-700">{motivoDemissao}</p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleReativar}
              disabled={saving}
              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Aguarde...' : 'Reativar funcionário'}
            </button>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-600 font-medium">
                Documentação rescisória
              </p>
              <p className={`text-xs font-bold ${completo ? 'text-green-600' : 'text-red-600'}`}>
                {obrigatoriosEnviados}/{obrigatoriosTotal} obrigatórios enviados
              </p>
            </div>
            <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completo ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist de documentos */}
        <div className="space-y-2">
          {defsDocumentos.map(def => {
            const docEnviado = docs.find(d => d.tipo === def.tipo);
            return (
              <DocCard
                key={def.tipo}
                def={def}
                doc={docEnviado}
                funcionarioId={funcionarioId}
                onAdded={handleDocAdded}
                onRemoved={handleDocRemoved}
              />
            );
          })}

          <OutrosCard
            docs={outrosDocs}
            funcionarioId={funcionarioId}
            onAdded={handleDocAdded}
            onRemoved={handleDocRemoved}
          />
        </div>
      </div>
    );
  }

  // ── Vista: ATIVO / AFASTADO / FÉRIAS ─────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Alterar status */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">Alterar Status</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={formStatus}
              onChange={e => setFormStatus(e.target.value as 'ativo' | 'afastado' | 'ferias')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleAlterarStatus}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {saving ? 'Salvando...' : 'Atualizar Status'}
          </button>
        </div>
      </div>

      {/* Registrar demissão */}
      <div>
        <h3 className="text-sm font-semibold text-red-600 mb-3 border-b border-red-100 pb-1">Registrar Demissão</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data de Demissão *</label>
            <input
              type="date"
              value={formData}
              onChange={e => setFormData(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de Demissão *</label>
            <select
              value={formTipo}
              onChange={e => setFormTipo(e.target.value as T_TipoDemissao)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            >
              {TIPOS_DEMISSAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Aviso prévio — condicional */}
          {exibeAviso && (
            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Aviso Prévio</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tipo *</label>
                  <select
                    value={formAviso.tipo}
                    onChange={e => setFormAviso(prev => ({ ...prev, tipo: e.target.value as T_AvisoPrevio['tipo'] }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400"
                  >
                    {TIPOS_AVISO.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={formAviso.dataInicio ?? ''}
                    disabled={formAviso.tipo === 'dispensado'}
                    onChange={e => setFormAviso(prev => ({ ...prev, dataInicio: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data de Fim</label>
                  <input
                    type="date"
                    value={formAviso.dataFim ?? ''}
                    disabled={formAviso.tipo === 'dispensado'}
                    onChange={e => setFormAviso(prev => ({ ...prev, dataFim: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Motivo / Observação</label>
            <textarea
              value={formMotivo}
              onChange={e => setFormMotivo(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDemitir}
            disabled={saving || !formData}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Registrando...' : 'Registrar Demissão'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tab_Demissao;
