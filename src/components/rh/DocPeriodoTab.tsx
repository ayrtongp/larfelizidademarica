import React, { useCallback, useEffect, useRef, useState } from 'react';
import { T_RhDocumentoPeriodo, TipoDocumentoPeriodo } from '@/types/T_rhDocumentosPeriodo';
import S_rhDocumentosPeriodo from '@/services/S_rhDocumentosPeriodo';
import { uploadArquivoPasta, deleteArquivoPastaSubPasta } from '@/actions/DO_UploadFile';
import { getUserID, updateProfile } from '@/utils/Login';
import { notifyError, notifySuccess } from '@/utils/Functions';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatSize(size: string) {
  const n = Number(size);
  if (!n) return size;
  return n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`;
}

interface Props {
  funcionarioId: string;
  funcionarioNome: string;
  tipo: TipoDocumentoPeriodo;
}

export default function DocPeriodoTab({ funcionarioId, funcionarioNome, tipo }: Props) {
  const anoAtual = new Date().getFullYear();
  const [docs, setDocs] = useState<T_RhDocumentoPeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAno, setFiltroAno] = useState(anoAtual);

  const [modalAberto, setModalAberto] = useState(false);
  const [uploadMes, setUploadMes] = useState(new Date().getMonth() + 1);
  const [uploadAno, setUploadAno] = useState(anoAtual);
  const [uploadDescricao, setUploadDescricao] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoSubstituicao, setConfirmandoSubstituicao] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await S_rhDocumentosPeriodo.getByFuncionario(funcionarioId, tipo, { ano: filtroAno });
      setDocs(data);
    } catch {
      notifyError('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }, [funcionarioId, tipo, filtroAno]);

  useEffect(() => { carregar(); }, [carregar]);

  const docExistente = docs.find(d => d.periodo.mes === uploadMes && d.periodo.ano === uploadAno);

  const abrirModal = () => {
    setUploadFile(null);
    setUploadDescricao('');
    setConfirmandoSubstituicao(false);
    setModalAberto(true);
  };

  const handleConfirmar = async () => {
    if (!uploadFile) return;

    if (docExistente && !confirmandoSubstituicao) {
      setConfirmandoSubstituicao(true);
      return;
    }

    setSalvando(true);
    try {
      const pasta = `funcionarios_clt/${funcionarioId}/${tipo}`;
      const profile = updateProfile();
      const nomeUsuario = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
      const userId = getUserID() ?? '';

      const resultado = await uploadArquivoPasta(uploadFile, pasta, nomeUsuario);
      if (!resultado) throw new Error('Falha no upload do arquivo');

      await S_rhDocumentosPeriodo.salvar({
        tipo,
        funcionarioId,
        funcionarioNome,
        periodo: { mes: uploadMes, ano: uploadAno },
        cloudURL: resultado.cloudURL,
        filename: resultado.filename,
        cloudFilename: resultado.cloudFilename,
        size: resultado.size,
        format: resultado.format,
        descricao: uploadDescricao,
        uploadedBy: userId,
        uploadedByNome: nomeUsuario,
      });

      notifySuccess('Documento enviado com sucesso!');
      setModalAberto(false);
      await carregar();
    } catch (err: any) {
      notifyError(err?.message || 'Erro ao enviar documento.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (doc: T_RhDocumentoPeriodo) => {
    if (!confirm(`Remover ${MESES[(doc.periodo.mes - 1)]}/${doc.periodo.ano}?`)) return;
    setRemovendoId(doc._id!);
    try {
      await deleteArquivoPastaSubPasta(
        `funcionarios_clt/${funcionarioId}/${tipo}`,
        doc.cloudFilename
      );
      await S_rhDocumentosPeriodo.remover(doc._id!);
      notifySuccess('Documento removido.');
      await carregar();
    } catch {
      notifyError('Erro ao remover documento.');
    } finally {
      setRemovendoId(null);
    }
  };

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => anoAtual - i);

  return (
    <div>
      {/* Header com filtro de ano e botão upload */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Ano:</span>
          <select
            value={filtroAno}
            onChange={e => setFiltroAno(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button
          onClick={abrirModal}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
        >
          + Enviar arquivo
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : docs.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
          Nenhum documento encontrado para {filtroAno}.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Período</th>
                <th className="px-4 py-2.5 text-left font-medium">Arquivo</th>
                <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Tamanho</th>
                <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Enviado em</th>
                <th className="px-4 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(doc => (
                <tr key={doc._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {MESES[doc.periodo.mes - 1]}/{doc.periodo.ano}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                    {doc.filename}
                    {doc.descricao && <span className="block text-xs text-gray-400">{doc.descricao}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatSize(doc.size)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={doc.cloudURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Abrir
                      </a>
                      <button
                        onClick={() => handleRemover(doc)}
                        disabled={removendoId === doc._id}
                        className="text-red-400 hover:text-red-600 text-xs font-medium disabled:opacity-50"
                      >
                        {removendoId === doc._id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de upload */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Enviar documento</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-xs">cancelar</button>
            </div>

            <div className="space-y-3">
              {/* Período */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mês</label>
                  <select
                    value={uploadMes}
                    onChange={e => { setUploadMes(Number(e.target.value)); setConfirmandoSubstituicao(false); }}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ano</label>
                  <select
                    value={uploadAno}
                    onChange={e => { setUploadAno(Number(e.target.value)); setConfirmandoSubstituicao(false); }}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Aviso de substituição */}
              {docExistente && !confirmandoSubstituicao && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Já existe um arquivo para {MESES[uploadMes - 1]}/{uploadAno}. Confirme para substituir.
                </p>
              )}
              {confirmandoSubstituicao && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  O arquivo existente será excluído. Clique em &quot;Confirmar&quot; para prosseguir.
                </p>
              )}

              {/* Arquivo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Arquivo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição <span className="font-normal text-gray-400">(opcional)</span></label>
                <input
                  value={uploadDescricao}
                  onChange={e => setUploadDescricao(e.target.value)}
                  placeholder="Ex: folha corrigida, versão final..."
                  className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmar}
              disabled={!uploadFile || salvando}
              className="mt-4 w-full py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors"
            >
              {salvando ? 'Enviando...' : confirmandoSubstituicao ? 'Confirmar substituição' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
