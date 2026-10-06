import React, { useEffect, useMemo, useState } from 'react';
import { FaDownload, FaFile, FaFileExcel, FaFileImage, FaFilePdf, FaFileWord, FaPen, FaTrash } from 'react-icons/fa';
import File_M4 from '@/components/Formularios/File_M4';
import Modalpadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { withApiAuth } from '@/utils/apiAuth';

type Source = 'empresa' | 'folha_pagamento';
interface ArquivoEmpresa {
  _id: string;
  r2FileId: string;
  source: Source;
  filename: string;
  descricao: string;
  categoria: string;
  size: string;
  format: string;
  createdAt: string;
  periodo?: { mes: number; ano: number };
}
const COMPANY_FOLDER = 'lar-felizidade';
const CATEGORIAS = ['Folha de pagamento', 'Contratos', 'LicenÃ§as e alvarÃ¡s', 'Contabilidade', 'Seguros', 'Documentos societÃ¡rios', 'Outros'];

function formatSize(value: string) {
  const bytes = Number(value);
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '';
}

function iconFor(format: string) {
  if (format.includes('pdf')) return <FaFilePdf className="text-red-500" />;
  if (format.includes('image')) return <FaFileImage className="text-green-500" />;
  if (format.includes('word') || format.includes('document')) return <FaFileWord className="text-blue-500" />;
  if (format.includes('sheet') || format.includes('excel')) return <FaFileExcel className="text-emerald-600" />;
  return <FaFile className="text-gray-400" />;
}

export default function GestaoArquivosEmpresa() {
  const [arquivos, setArquivos] = useState<ArquivoEmpresa[]>([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaUpload, setCategoriaUpload] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [editDescricao, setEditDescricao] = useState('');
  const [editCategoria, setEditCategoria] = useState('');

  async function carregar() {
    const response = await fetch('/api/Controller/C_arquivosEmpresa?type=list', { headers: withApiAuth() });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Erro ao listar arquivos');
    setArquivos(data.arquivos ?? []);
  }

  useEffect(() => { carregar().catch(() => notifyError('NÃ£o foi possÃ­vel carregar os arquivos da empresa.')); }, []);

  const filtrados = useMemo(() => arquivos.filter(arquivo => {
    const texto = `${arquivo.filename} ${arquivo.descricao}`.toLowerCase();
    return (!busca || texto.includes(busca.toLowerCase())) && (!categoria || arquivo.categoria === categoria);
  }), [arquivos, busca, categoria]);

  async function abrir(arquivo: ArquivoEmpresa) {
    const response = await fetch(`/api/proxy/arquivos-empresa-url?id=${encodeURIComponent(arquivo.r2FileId)}`, { headers: withApiAuth() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) { notifyError(data.error || 'NÃ£o foi possÃ­vel abrir o arquivo.'); return; }
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  async function excluir(arquivo: ArquivoEmpresa) {
    if (arquivo.source !== 'empresa') return;
    if (!confirm(`Excluir o arquivo "${arquivo.filename}"?`)) return;
    const response = await fetch(`/api/proxy/arquivos-empresa-delete?id=${encodeURIComponent(arquivo.r2FileId)}`, { method: 'DELETE', headers: withApiAuth() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) { notifyError(data.error || 'Erro ao excluir arquivo.'); return; }
    notifySuccess('Arquivo excluÃ­do.');
    await carregar();
  }

  function iniciarEdicao(arquivo: ArquivoEmpresa) {
    setEditando(arquivo._id);
    setEditDescricao(arquivo.descricao === arquivo.filename ? '' : arquivo.descricao);
    setEditCategoria(arquivo.categoria);
  }

  async function salvarEdicao(arquivo: ArquivoEmpresa) {
    const response = await fetch(`/api/Controller/C_arquivosEmpresa?id=${encodeURIComponent(arquivo._id)}`, {
      method: 'PUT', headers: withApiAuth({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ descricao: editDescricao, categoria: editCategoria }),
    });
    if (!response.ok) { notifyError('NÃ£o foi possÃ­vel atualizar o arquivo.'); return; }
    setEditando(null);
    await carregar();
  }

  const extraFields = {
    collection: 'empresa_arquivos', resource: 'empresa', userId: COMPANY_FOLDER,
    folder: COMPANY_FOLDER, isPublic: 'false',
    ...(categoriaUpload ? { tags: categoriaUpload } : {}),
    ...(descricao ? { descricao } : {}),
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Arquivos da Empresa</h2>
            <p className="text-xs text-gray-500 mt-1">Acervo privado do Lar, acessÃ­vel somente Ã  AdministraÃ§Ã£o.</p>
          </div>
          <Button_M3 label="Novo arquivo" onClick={() => setModalAberto(true)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar arquivo..." className="border rounded-lg px-3 py-2 text-sm w-64" />
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtrados.length === 0 ? <p className="text-sm text-gray-400 text-center py-12">Nenhum arquivo encontrado.</p> : (
          <ul className="divide-y divide-gray-100">
            {filtrados.map(arquivo => (
              <li key={`${arquivo.source}-${arquivo.r2FileId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-lg">{iconFor(arquivo.format)}</div>
                <div className="min-w-0 flex-1">
                  {editando === arquivo._id && arquivo.source === 'empresa' ? (
                    <div className="flex flex-wrap gap-2">
                      <input value={editDescricao} onChange={e => setEditDescricao(e.target.value)} placeholder="DescriÃ§Ã£o" className="border rounded px-2 py-1 text-sm flex-1 min-w-48" />
                      <select value={editCategoria} onChange={e => setEditCategoria(e.target.value)} className="border rounded px-2 py-1 text-sm">
                        <option value="">Sem categoria</option>{CATEGORIAS.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <button onClick={() => salvarEdicao(arquivo)} className="text-indigo-600 text-xs font-semibold">Salvar</button>
                      <button onClick={() => setEditando(null)} className="text-gray-500 text-xs">Cancelar</button>
                    </div>
                  ) : <>
                    <p className="text-sm font-medium text-gray-800 truncate">{arquivo.descricao || arquivo.filename}</p>
                    <p className="text-xs text-gray-500 truncate">{arquivo.filename}</p>
                    <div className="flex gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span>{arquivo.categoria || 'Sem categoria'}</span><span>{formatDate(arquivo.createdAt)}</span><span>{formatSize(arquivo.size)}</span>
                      {arquivo.source === 'folha_pagamento' && <span className="text-indigo-500">Vinculado Ã  folha</span>}
                    </div>
                  </>}
                </div>
                {editando !== arquivo._id && <div className="flex gap-2 text-gray-400">
                  <button onClick={() => abrir(arquivo)} title="Abrir" className="hover:text-blue-600"><FaDownload size={13} /></button>
                  {arquivo.source === 'empresa' && <><button onClick={() => iniciarEdicao(arquivo)} title="Editar" className="hover:text-indigo-600"><FaPen size={13} /></button><button onClick={() => excluir(arquivo)} title="Excluir" className="hover:text-red-600"><FaTrash size={13} /></button></>}
                </div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modalpadrao isOpen={modalAberto} onClose={() => setModalAberto(false)}>
        <div className="p-5 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-center">Adicionar arquivo da empresa</h2>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="DescriÃ§Ã£o do arquivo (opcional)" className="border rounded-lg px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map(item => <button key={item} type="button" onClick={() => setCategoriaUpload(current => current === item ? '' : item)} className={`px-3 py-1.5 rounded-full text-xs border ${categoriaUpload === item ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-300 text-gray-600'}`}>{item}</button>)}
          </div>
          <File_M4
            infoProps={{ dbName: 'empresa_arquivos', residenteId: COMPANY_FOLDER, descricao }}
            folders={`empresa/${COMPANY_FOLDER}/arquivos`}
            triggerEffect={() => { setModalAberto(false); setDescricao(''); setCategoriaUpload(''); carregar().catch(() => undefined); }}
            uploadUrl="/api/proxy/r2-upload-empresa"
            extraFields={extraFields}
          />
        </div>
      </Modalpadrao>
    </div>
  );
}


