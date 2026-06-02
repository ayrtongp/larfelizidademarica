import React, { useCallback, useEffect, useRef, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useRouter } from 'next/router';
import S_rhDocumentosPeriodo from '@/services/S_rhDocumentosPeriodo';
import { StatusFolhaPonto, T_ResumoFolhaPonto } from '@/types/T_rhDocumentosPeriodo';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { uploadArquivoPasta, abrirArquivoR2 } from '@/actions/DO_UploadFile';
import { getUserID, updateProfile } from '@/utils/Login';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildMensagemPreview(pendentes: T_ResumoFolhaPonto[], mes: number, ano: number): string {
  const lista = pendentes.map(f => `• ${f.nome}`).join('\n');
  return `📋 *Folha de Ponto — ${MESES[mes - 1]}/${ano}*\n⚠️ Funcionários sem envio:\n\n${lista}\n\nFavor enviar até o 5º dia útil.`;
}

const STATUS_CONFIG: Record<StatusFolhaPonto, { label: string; classes: string }> = {
  enviado:   { label: 'Enviado',   classes: 'bg-blue-100 text-blue-700' },
  reenviado: { label: 'Reenviado', classes: 'bg-purple-100 text-purple-700' },
  aprovado:  { label: 'Aprovado',  classes: 'bg-green-100 text-green-700' },
  reprovado: { label: 'Reprovado', classes: 'bg-red-100 text-red-600' },
};

interface UploadTarget {
  funcionarioId: string;
  nome: string;
  jaTemDocumento: boolean;
  statusAtual?: StatusFolhaPonto;
}

interface ReprovacaoModal {
  id: string;
  nome: string;
}

export default function FolhaPontoPage() {
  const { hasGroup: isRH } = useHasGroup('rh');
  const router = useRouter();

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  const [filtroMes, setFiltroMes] = useState(hoje.getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(anoAtual);
  const [resumo, setResumo] = useState<T_ResumoFolhaPonto[]>([]);
  const [loading, setLoading] = useState(true);

  // modal aviso WPP
  const [enviandoAviso, setEnviandoAviso] = useState(false);
  const [modalAviso, setModalAviso] = useState(false);

  // download ZIP
  const [downloadingZip, setDownloadingZip] = useState(false);

  // enviar para contabilidade
  const [enviandoContabilidade, setEnviandoContabilidade] = useState(false);

  // modal upload rápido — período sempre igual ao filtro ativo
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescricao, setUploadDescricao] = useState('');
  const [confirmandoSubstituicao, setConfirmandoSubstituicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // modal reprovação
  const [reprovacaoModal, setReprovacaoModal] = useState<ReprovacaoModal | null>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [salvandoStatus, setSalvandoStatus] = useState(false);

  const anos = Array.from({ length: 3 }, (_, i) => anoAtual - i);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await S_rhDocumentosPeriodo.getResumoMes(filtroMes, filtroAno);
      setResumo(data);
    } catch {
      notifyError('Erro ao carregar resumo de folhas de ponto.');
    } finally {
      setLoading(false);
    }
  }, [filtroMes, filtroAno]);

  useEffect(() => { carregar(); }, [carregar]);

  const semDocumento  = resumo.filter(r => !r.enviado);
  const comDocumento  = resumo.filter(r => r.enviado);
  const aprovados     = comDocumento.filter(r => r.documento?.status === 'aprovado');
  const reprovados    = comDocumento.filter(r => r.documento?.status === 'reprovado');
  // pendentes para o aviso WPP = sem documento + reprovados
  const pendentesAviso = resumo.filter(r => !r.enviado || r.documento?.status === 'reprovado');

  // --- download ZIP ---
  const handleDownloadZip = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';
    setDownloadingZip(true);
    try {
      const res = await fetch(`/api/proxy/rh-folha-zip?mes=${filtroMes}&ano=${filtroAno}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao gerar ZIP');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `folhas-ponto-${MESES[filtroMes - 1]}-${filtroAno}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      notifyError(err?.message || 'Erro ao baixar ZIP.');
    } finally {
      setDownloadingZip(false);
    }
  };

  // --- enviar para contabilidade ---
  const handleEnviarContabilidade = async () => {
    if (!confirm(`Enviar as ${comDocumento.length} folha(s) de ${MESES[filtroMes - 1]}/${filtroAno} para o grupo da Contabilidade no WhatsApp?`)) return;
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';
    setEnviandoContabilidade(true);
    try {
      const res = await fetch(`/api/rh/folha-ponto-contabilidade?mes=${filtroMes}&ano=${filtroAno}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar');
      notifySuccess(`${data.arquivos} folha(s) enviada(s) para a Contabilidade!`);
    } catch (err: any) {
      notifyError(err?.message || 'Erro ao enviar para contabilidade.');
    } finally {
      setEnviandoContabilidade(false);
    }
  };

  // --- aviso WPP ---
  const handleEnviarAviso = async () => {
    setEnviandoAviso(true);
    try {
      const { pendentes: n } = await S_rhDocumentosPeriodo.enviarAviso(filtroMes, filtroAno);
      notifySuccess(n > 0 ? `Aviso enviado para ${n} funcionário(s)!` : 'Nenhum pendente no momento.');
      setModalAviso(false);
    } catch {
      notifyError('Erro ao enviar aviso pelo WhatsApp.');
    } finally {
      setEnviandoAviso(false);
    }
  };

  // --- upload rápido ---
  const abrirUpload = (item: T_ResumoFolhaPonto) => {
    setUploadTarget({ funcionarioId: item.funcionarioId, nome: item.nome, jaTemDocumento: item.enviado, statusAtual: item.documento?.status });
    setUploadFile(null);
    setUploadDescricao('');
    setConfirmandoSubstituicao(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fecharUpload = () => setUploadTarget(null);

  const docExisteNoPeriodoSelecionado = uploadTarget?.jaTemDocumento;

  const handleConfirmarUpload = async () => {
    if (!uploadFile || !uploadTarget) return;
    if (docExisteNoPeriodoSelecionado && !confirmandoSubstituicao) {
      setConfirmandoSubstituicao(true);
      return;
    }
    setSalvando(true);
    try {
      const profile = updateProfile();
      const nomeUsuario = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
      const userId = getUserID() ?? '';
      const pasta = `funcionarios_clt/${uploadTarget.funcionarioId}/folha_ponto`;
      const resultado = await uploadArquivoPasta(uploadFile, pasta, nomeUsuario);
      if (!resultado) throw new Error('Falha no upload do arquivo');
      const docSalvo = await S_rhDocumentosPeriodo.salvar({
        tipo: 'folha_ponto',
        funcionarioId: uploadTarget.funcionarioId,
        funcionarioNome: uploadTarget.nome,
        periodo: { mes: filtroMes, ano: filtroAno },
        cloudURL: resultado.cloudURL,
        filename: resultado.filename,
        cloudFilename: resultado.cloudFilename,
        r2FileId: resultado.r2FileId ?? resultado.cloudFilename,
        size: resultado.size,
        format: resultado.format,
        descricao: uploadDescricao,
        uploadedBy: userId,
        uploadedByNome: nomeUsuario,
      });
      // atualiza a linha localmente sem rebuscar toda a tabela
      const target = uploadTarget;
      setResumo(prev => prev.map(r =>
        r.funcionarioId === target.funcionarioId
          ? { ...r, enviado: true, documento: docSalvo }
          : r
      ));
      notifySuccess(`Folha de ponto de ${target.nome} enviada!`);
      fecharUpload();
    } catch (err: any) {
      notifyError(err?.message || 'Erro ao enviar documento.');
    } finally {
      setSalvando(false);
    }
  };

  // --- aprovação / reprovação ---
  const getPerfilAtual = () => {
    const profile = updateProfile();
    return {
      id: getUserID() ?? '',
      nome: profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '',
    };
  };

  const handleAprovar = async (item: T_ResumoFolhaPonto) => {
    if (!item.documento?._id) return;
    const { id, nome } = getPerfilAtual();
    setSalvandoStatus(true);
    try {
      await S_rhDocumentosPeriodo.atualizarStatus(item.documento._id, 'aprovado', {
        atualizadoPor: id,
        atualizadoPorNome: nome,
      });
      notifySuccess(`Folha de ${item.nome} aprovada.`);
      await carregar();
    } catch {
      notifyError('Erro ao aprovar.');
    } finally {
      setSalvandoStatus(false);
    }
  };

  const abrirReprovacao = (item: T_ResumoFolhaPonto) => {
    if (!item.documento?._id) return;
    setReprovacaoModal({ id: item.documento._id, nome: item.nome });
    setMotivoReprovacao('');
  };

  const handleConfirmarReprovacao = async () => {
    if (!reprovacaoModal || !motivoReprovacao.trim()) return;
    const { id, nome } = getPerfilAtual();
    setSalvandoStatus(true);
    try {
      await S_rhDocumentosPeriodo.atualizarStatus(reprovacaoModal.id, 'reprovado', {
        motivoReprovacao: motivoReprovacao.trim(),
        atualizadoPor: id,
        atualizadoPorNome: nome,
      });
      notifySuccess(`Folha de ${reprovacaoModal.nome} reprovada.`);
      setReprovacaoModal(null);
      await carregar();
    } catch (err: any) {
      notifyError(err?.message || 'Erro ao reprovar.');
    } finally {
      setSalvandoStatus(false);
    }
  };

  const renderStatusBadge = (item: T_ResumoFolhaPonto) => {
    if (!item.enviado) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          Pendente
        </span>
      );
    }
    const st = item.documento?.status ?? 'enviado';
    const cfg = STATUS_CONFIG[st];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <PermissionWrapper href="/portal" groups={['rh']}>
      <PortalBase>
        <div className="col-span-full">

          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Folha de Ponto</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filtroMes}
                onChange={e => setFiltroMes(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={filtroAno}
                onChange={e => setFiltroAno(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {comDocumento.length > 0 && (
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="px-4 py-1.5 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {downloadingZip ? 'Gerando...' : '⬇ ZIP'}
                </button>
              )}
              {isRH && comDocumento.length > 0 && (
                <button
                  onClick={handleEnviarContabilidade}
                  disabled={enviandoContabilidade}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {enviandoContabilidade ? 'Enviando...' : '📊 Enviar Contabilidade'}
                </button>
              )}
              {isRH && pendentesAviso.length > 0 && (
                <button
                  onClick={() => setModalAviso(true)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                >
                  📲 Avisar no WhatsApp ({pendentesAviso.length})
                </button>
              )}
            </div>
          </div>

          {/* Stat cards */}
          {!loading && resumo.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-800">{resumo.length}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-green-600 uppercase font-medium mb-1">Aprovadas</p>
                <p className="text-2xl font-bold text-green-700">{aprovados.length}</p>
              </div>
              <div className={`${semDocumento.length > 0 || reprovados.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 shadow-sm`}>
                <p className={`text-xs uppercase font-medium mb-1 ${semDocumento.length > 0 || reprovados.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>Pendentes</p>
                <p className={`text-2xl font-bold ${semDocumento.length > 0 || reprovados.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{semDocumento.length}</p>
              </div>
              <div className={`${reprovados.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 shadow-sm`}>
                <p className={`text-xs uppercase font-medium mb-1 ${reprovados.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>Reprovadas</p>
                <p className={`text-2xl font-bold ${reprovados.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{reprovados.length}</p>
              </div>
            </div>
          )}

          {/* Tabela */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Carregando...</div>
          ) : resumo.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhum funcionário CLT ativo encontrado.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Funcionário</th>
                    <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Cargo / Setor</th>
                    <th className="px-5 py-3 text-center font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Enviado em</th>
                    <th className="px-5 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumo.map(item => (
                    <tr key={item.funcionarioId} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{item.nome}</p>
                        {item.documento?.status === 'reprovado' && item.documento.motivoReprovacao && (
                          <p className="text-xs text-red-500 mt-0.5">↳ {item.documento.motivoReprovacao}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <p className="text-gray-700">{item.cargo || '—'}</p>
                        <p className="text-xs text-gray-400">{item.setor || ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {renderStatusBadge(item)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">
                        {item.documento?.createdAt
                          ? new Date(item.documento.createdAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Aprovar / Reprovar — só para RH e se tem documento não aprovado */}
                          {isRH && item.enviado && item.documento?.status !== 'aprovado' && (
                            <>
                              <button
                                onClick={() => handleAprovar(item)}
                                disabled={salvandoStatus}
                                className="text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                ✓ Aprovar
                              </button>
                              <button
                                onClick={() => abrirReprovacao(item)}
                                disabled={salvandoStatus}
                                className="text-xs font-medium px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                ✕ Reprovar
                              </button>
                            </>
                          )}
                          {/* Enviar / Substituir */}
                          <button
                            onClick={() => abrirUpload(item)}
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            {item.enviado ? '↑ Substituir' : '↑ Enviar'}
                          </button>
                          {/* Abrir arquivo */}
                          {item.documento?.r2FileId && (
                            <button
                              onClick={() => abrirArquivoR2(item.documento!.r2FileId!)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                            >
                              Abrir
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/portal/administrativo/funcionarios/${item.funcionarioId}?tab=folha_ponto`)}
                            className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                          >
                            Perfil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal upload rápido */}
        {uploadTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Enviar Folha de Ponto</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{uploadTarget.nome}</p>
                </div>
                <button onClick={fecharUpload} className="text-gray-400 hover:text-gray-600 text-xs mt-0.5">cancelar</button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <span>📅 Período:</span>
                  <span className="font-medium text-gray-700">{MESES[filtroMes - 1]} / {filtroAno}</span>
                </div>

                {docExisteNoPeriodoSelecionado && !confirmandoSubstituicao && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Já existe um arquivo para {MESES[filtroMes - 1]}/{filtroAno}. Confirme para substituir.
                  </p>
                )}
                {confirmandoSubstituicao && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    O arquivo existente será substituído. Clique em &quot;Confirmar&quot; para prosseguir.
                  </p>
                )}

                {uploadTarget.statusAtual === 'reprovado' && (
                  <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                    Este envio ficará como <strong>reenviado</strong> para nova revisão do RH.
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Arquivo <span className="text-red-400">*</span>
                  </label>
                  <label className={`flex items-center gap-3 px-3 py-2.5 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                    <span className="text-lg">{uploadFile ? '📄' : '📁'}</span>
                    <span className="text-sm text-gray-600 truncate">
                      {uploadFile ? uploadFile.name : 'Clique para selecionar o arquivo'}
                    </span>
                    {uploadFile && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="ml-auto text-gray-400 hover:text-gray-600 text-xs shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </label>
                  <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG ou WEBP · máx. 5 MB</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Descrição <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <input
                    value={uploadDescricao}
                    onChange={e => setUploadDescricao(e.target.value)}
                    placeholder="Ex: folha corrigida, versão final..."
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirmarUpload}
                disabled={!uploadFile || salvando}
                className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                  uploadFile && !salvando
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                {salvando ? 'Enviando...' : !uploadFile ? 'Selecione um arquivo acima' : confirmandoSubstituicao ? 'Confirmar substituição' : 'Confirmar envio'}
              </button>
            </div>
          </div>
        )}

        {/* Modal reprovação */}
        {reprovacaoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-1">Reprovar Folha de Ponto</h2>
              <p className="text-sm text-gray-500 mb-4">{reprovacaoModal.nome}</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Motivo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={motivoReprovacao}
                  onChange={e => setMotivoReprovacao(e.target.value)}
                  rows={3}
                  placeholder="Descreva o motivo da reprovação..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setReprovacaoModal(null)}
                  disabled={salvandoStatus}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarReprovacao}
                  disabled={!motivoReprovacao.trim() || salvandoStatus}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {salvandoStatus ? 'Salvando...' : 'Confirmar reprovação'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal aviso WhatsApp */}
        {modalAviso && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Enviar aviso no WhatsApp</h2>
              <p className="text-sm text-gray-500 mb-4">
                A seguinte mensagem será enviada para o grupo principal:
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap text-gray-700 mb-5 font-sans leading-relaxed">
                {buildMensagemPreview(pendentesAviso, filtroMes, filtroAno)}
              </pre>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalAviso(false)}
                  disabled={enviandoAviso}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviarAviso}
                  disabled={enviandoAviso}
                  className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-60"
                >
                  {enviandoAviso ? 'Enviando...' : 'Confirmar envio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </PortalBase>
    </PermissionWrapper>
  );
}
