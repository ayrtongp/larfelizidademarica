import React, { useCallback, useEffect, useRef, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import S_rhDocumentosPeriodo from '@/services/S_rhDocumentosPeriodo';
import { T_ResumoFolhaPonto } from '@/types/T_rhDocumentosPeriodo';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { uploadArquivoPasta, abrirArquivoR2, deleteArquivoPastaSubPasta } from '@/actions/DO_UploadFile';
import { getUserID, updateProfile } from '@/utils/Login';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface UploadTarget {
  funcionarioId: string;
  nome: string;
  jaTemDocumento: boolean;
}

export default function ContraquequesPage() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  // filtroMes/filtroAno = mês de LANÇAMENTO/PAGAMENTO (ex: Junho)
  const [filtroMes, setFiltroMes] = useState(hoje.getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(anoAtual);

  // mesRef/anoRef = mês de REFERÊNCIA do trabalho (sempre o anterior)
  const mesRef = filtroMes === 1 ? 12 : filtroMes - 1;
  const anoRef = filtroMes === 1 ? filtroAno - 1 : filtroAno;

  const [resumo, setResumo] = useState<T_ResumoFolhaPonto[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescricao, setUploadDescricao] = useState('');
  const [confirmandoSubstituicao, setConfirmandoSubstituicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [removendoId, setRemovendoId] = useState<string | null>(null);

  // Estado do modal de envio por email
  const [modalEmail, setModalEmail] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [enviandoEmails, setEnviandoEmails] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<any>(null);

  const anos = Array.from({ length: 3 }, (_, i) => anoAtual - i);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await S_rhDocumentosPeriodo.getResumoMes(mesRef, anoRef, 'contracheque');
      setResumo(data);
    } catch {
      notifyError('Erro ao carregar contracheques.');
    } finally {
      setLoading(false);
    }
  }, [mesRef, anoRef]);

  useEffect(() => { carregar(); }, [carregar]);

  const enviados = resumo.filter(r => r.enviado).length;
  const pendentes = resumo.filter(r => !r.enviado).length;

  const abrirUpload = (r: T_ResumoFolhaPonto) => {
    setUploadTarget({ funcionarioId: r.funcionarioId, nome: r.nome, jaTemDocumento: r.enviado });
    setUploadFile(null);
    setUploadDescricao('');
    setConfirmandoSubstituicao(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!uploadTarget || !uploadFile) return;
    if (uploadTarget.jaTemDocumento && !confirmandoSubstituicao) {
      setConfirmandoSubstituicao(true);
      return;
    }
    setSalvando(true);
    try {
      const pasta = `funcionarios_clt/${uploadTarget.funcionarioId}/contracheque`;
      const profile = updateProfile();
      const nomeUsuario = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
      const userId = getUserID() ?? '';

      const resultado = await uploadArquivoPasta(uploadFile, pasta, nomeUsuario);
      if (!resultado) throw new Error('Falha no upload');

      await S_rhDocumentosPeriodo.salvar({
        tipo: 'contracheque',
        funcionarioId: uploadTarget.funcionarioId,
        funcionarioNome: uploadTarget.nome,
        periodo: { mes: mesRef, ano: anoRef },
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

      notifySuccess(`Contracheque enviado para ${uploadTarget.nome}!`);
      setUploadTarget(null);
      await carregar();
    } catch (err: any) {
      notifyError(err?.message || 'Erro ao enviar contracheque.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (r: T_ResumoFolhaPonto) => {
    if (!r.documento?._id) return;
    if (!confirm(`Remover contracheque de ${r.nome} — Ref. ${MESES[mesRef - 1]}/${anoRef}?`)) return;
    setRemovendoId(r.documento._id);
    try {
      await deleteArquivoPastaSubPasta(
        `funcionarios_clt/${r.funcionarioId}/contracheque`,
        r.documento.cloudFilename
      );
      await S_rhDocumentosPeriodo.remover(r.documento._id);
      notifySuccess('Contracheque removido.');
      await carregar();
    } catch {
      notifyError('Erro ao remover contracheque.');
    } finally {
      setRemovendoId(null);
    }
  };

  const abrirModalEmail = async () => {
    if (enviados === 0) { notifyError('Nenhum contracheque para enviar.'); return; }
    setModalEmail(true);
    setPreviewData(null);
    setResultadoEnvio(null);
    setSelecionados(new Set());
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/rh/enviar-contracheques?mes=${mesRef}&ano=${anoRef}`);
      const data = await res.json();
      setPreviewData(data);
      const iniciais = new Set<string>(
        (data.destinatarios ?? [])
          .filter((d: any) => d.status === 'ok' && !d.emailEnviadoEm)
          .map((d: any) => d.nome)
      );
      setSelecionados(iniciais);
    } catch {
      notifyError('Erro ao carregar destinatários.');
      setModalEmail(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const toggleSelecionado = (nome: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome); else next.add(nome);
      return next;
    });
  };

  const confirmarEnvioEmails = async () => {
    if (selecionados.size === 0) { notifyError('Selecione ao menos um destinatário.'); return; }
    setEnviandoEmails(true);
    try {
      const res = await fetch('/api/rh/enviar-contracheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes: mesRef, ano: anoRef, selecionados: Array.from(selecionados) }),
      });
      const data = await res.json();
      if (!res.ok) { notifyError(data.message || 'Erro ao enviar.'); return; }
      setResultadoEnvio(data);
      notifySuccess(`${data.enviados} email${data.enviados !== 1 ? 's' : ''} enviado${data.enviados !== 1 ? 's' : ''}!`);
    } catch {
      notifyError('Erro ao enviar contracheques por email.');
    } finally {
      setEnviandoEmails(false);
    }
  };

  return (
    <PermissionWrapper href="/portal" groups={['rh']}>
      <PortalBase>
        <div className="col-span-full">

          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Contracheques</h1>
              <p className="text-xs text-gray-400">
                Lançamento: {MESES[filtroMes - 1]}/{filtroAno} — Referência: {MESES[mesRef - 1]}/{anoRef}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select value={filtroMes} onChange={e => setFiltroMes(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={filtroAno} onChange={e => setFiltroAno(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {enviados > 0 && (
                <button
                  type="button"
                  onClick={abrirModalEmail}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                >
                  Enviar por email ({enviados})
                </button>
              )}
            </div>
          </div>

          {/* Resumo */}
          {!loading && resumo.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm">
                <span className="text-gray-500">Total:</span> <strong className="text-gray-800">{resumo.length}</strong>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
                <span className="text-green-600">Enviados:</span> <strong className="text-green-700">{enviados}</strong>
              </div>
              {pendentes > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                  <span className="text-red-600">Pendentes:</span> <strong className="text-red-700">{pendentes}</strong>
                </div>
              )}
            </div>
          )}

          {/* Tabela */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Carregando...</div>
          ) : resumo.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhum funcionário ativo encontrado.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Funcionário</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Cargo</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Arquivo</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumo.map(r => (
                    <tr key={r.funcionarioId} className={`hover:bg-gray-50 ${!r.enviado ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {(r as any).foto ? (
                            <img src={(r as any).foto} className="w-8 h-8 rounded-full object-cover shrink-0" alt={r.nome} />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {r.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{r.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.cargo}</td>
                      <td className="px-4 py-3 text-center">
                        {r.enviado ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Enviado</span>
                            {(r.documento as any)?.emailEnviadoEm && (
                              <span className="text-xs text-green-500">email {new Date((r.documento as any).emailEnviadoEm).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Pendente</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell max-w-[180px] truncate">
                        {r.documento?.filename ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.enviado && r.documento && (
                            <button
                              type="button"
                              onClick={() => abrirArquivoR2(r.documento!.r2FileId ?? r.documento!.cloudFilename)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                            >
                              Abrir
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => abrirUpload(r)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            {r.enviado ? 'Substituir' : 'Enviar'}
                          </button>
                          {r.enviado && r.documento?._id && (
                            <button
                              type="button"
                              onClick={() => handleRemover(r)}
                              disabled={removendoId === r.documento!._id}
                              className="text-red-400 hover:text-red-600 text-xs font-medium disabled:opacity-50"
                            >
                              {removendoId === r.documento!._id ? '...' : 'Excluir'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de upload */}
        {uploadTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Enviar contracheque</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{uploadTarget.nome} — Ref. {MESES[mesRef - 1]}/{anoRef}</p>
                </div>
                <button type="button" onClick={() => setUploadTarget(null)} className="text-gray-400 hover:text-gray-600 text-xs">cancelar</button>
              </div>

              <div className="space-y-3">
                {uploadTarget.jaTemDocumento && !confirmandoSubstituicao && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Já existe um contracheque para este período. Confirme para substituir.
                  </p>
                )}
                {confirmandoSubstituicao && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    O arquivo existente será excluído. Clique em &quot;Confirmar&quot; para prosseguir.
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Arquivo <span className="text-red-400">*</span></label>
                  <label className={`flex items-center gap-3 px-3 py-2.5 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-300'}`}>
                    <input ref={fileInputRef} type="file" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} className="sr-only" />
                    <span className="text-sm text-gray-600 truncate">{uploadFile ? uploadFile.name : 'Clique para selecionar'}</span>
                    {uploadFile && (
                      <button type="button" onClick={e => { e.preventDefault(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="ml-auto text-gray-400 hover:text-gray-600 text-xs shrink-0">✕</button>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrição <span className="font-normal text-gray-400">(opcional)</span></label>
                  <input value={uploadDescricao} onChange={e => setUploadDescricao(e.target.value)}
                    placeholder="Ex: holerite, versão corrigida..."
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              <button type="button" onClick={handleUpload} disabled={!uploadFile || salvando}
                className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                  uploadFile && !salvando ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}>
                {salvando ? 'Enviando...' : confirmandoSubstituicao ? 'Confirmar substituição' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}

        {/* Modal de envio por email */}
        {modalEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !enviandoEmails && setModalEmail(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Enviar contracheques por email</h3>
                  <p className="text-xs text-gray-400">Ref. {MESES[mesRef - 1]}/{anoRef}</p>
                </div>
                {!enviandoEmails && (
                  <button type="button" onClick={() => setModalEmail(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                {loadingPreview ? (
                  <p className="text-sm text-gray-400 text-center py-6">Verificando emails...</p>
                ) : resultadoEnvio ? (
                  // Resultado do envio
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="text-green-600 font-semibold">{resultadoEnvio.enviados} enviado{resultadoEnvio.enviados !== 1 ? 's' : ''}</span>
                      {resultadoEnvio.erros > 0 && <span className="text-red-500 font-semibold">{resultadoEnvio.erros} erro{resultadoEnvio.erros !== 1 ? 's' : ''}</span>}
                    </div>
                    <div className="space-y-1">
                      {resultadoEnvio.detalhes.map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                          <span className="text-gray-700">{d.nome}</span>
                          {d.status === 'OK' ? (
                            <span className="text-xs text-green-600 font-medium">Enviado</span>
                          ) : (
                            <span className="text-xs text-red-500 font-medium" title={d.motivo}>Erro</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : previewData ? (
                  // Preview dos destinatários com checkboxes
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="text-green-600 font-semibold">{selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}</span>
                      <span className="text-gray-400">de {previewData.aptos} apto{previewData.aptos !== 1 ? 's' : ''}</span>
                      {previewData.semEmail > 0 && <span className="text-yellow-600 font-semibold">{previewData.semEmail} sem email</span>}
                      {previewData.emailInvalido > 0 && <span className="text-orange-500 font-semibold">{previewData.emailInvalido} inválido{previewData.emailInvalido !== 1 ? 's' : ''}</span>}
                    </div>
                    <div className="space-y-0.5">
                      {previewData.destinatarios.map((d: any, i: number) => {
                        const isOk = d.status === 'ok';
                        const jaEnviado = !!d.emailEnviadoEm;
                        return (
                          <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm ${!isOk ? 'bg-yellow-50' : jaEnviado && !selecionados.has(d.nome) ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                            {isOk ? (
                              <input
                                type="checkbox"
                                checked={selecionados.has(d.nome)}
                                onChange={() => toggleSelecionado(d.nome)}
                                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                              />
                            ) : (
                              <div className="w-4 h-4 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-800 font-medium">{d.nome}</span>
                              {jaEnviado && (
                                <span className="ml-2 text-xs text-green-600">enviado em {new Date(d.emailEnviadoEm).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                            {isOk ? (
                              <span className="text-xs text-gray-500 shrink-0">{d.email}</span>
                            ) : d.status === 'sem_email' ? (
                              <span className="text-xs text-yellow-600 font-medium shrink-0">Sem email</span>
                            ) : (
                              <span className="text-xs text-orange-500 font-medium shrink-0" title={d.email}>Inválido</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                {resultadoEnvio ? (
                  <button type="button" onClick={() => setModalEmail(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
                    Fechar
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setModalEmail(false)} disabled={enviandoEmails} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50">
                      Cancelar
                    </button>
                    <button type="button" onClick={confirmarEnvioEmails} disabled={enviandoEmails || selecionados.size === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
                      {enviandoEmails ? 'Enviando...' : `Confirmar envio (${selecionados.size})`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  );
}
