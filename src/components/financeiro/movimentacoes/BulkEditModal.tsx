import React, { useEffect, useState } from 'react';
import PessoaCombobox, { PessoaItem } from '@/components/financeiro/shared/PessoaCombobox';
import S_financeiroMovimentacoes from '@/services/S_financeiroMovimentacoes';

interface Props {
  ids: string[];
  onSuccess: () => void;
  onClose: () => void;
}

interface RawPessoa { _id: string; nome: string; sobrenome?: string; }

export default function BulkEditModal({ ids, onSuccess, onClose }: Props) {
  const [categorias, setCategorias] = useState<{ _id: string; nome: string }[]>([]);
  const [pessoas, setPessoas] = useState<PessoaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [alterarCategoria, setAlterarCategoria] = useState(false);
  const [categoriaId, setCategoriaId] = useState('');

  const [alterarCompetencia, setAlterarCompetencia] = useState(false);
  const [competencia, setCompetencia] = useState('');

  const [alterarVinculo, setAlterarVinculo] = useState(false);
  const [vinculadoId, setVinculadoId] = useState('');
  const [vinculadoTipo, setVinculadoTipo] = useState<'usuario' | 'residente' | ''>('');

  useEffect(() => {
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => {});

    Promise.all([
      fetch('/api/Controller/Usuario?type=getProfissionais').then((r) => r.ok ? r.json() : []),
      fetch('/api/Controller/ResidentesController?type=getAllActive').then((r) => r.ok ? r.json() : []),
    ]).then(([us, rs]) => {
      const lista: PessoaItem[] = [
        ...(Array.isArray(us) ? us : []).map((u: RawPessoa) => ({ id: u._id, nome: u.sobrenome ? `${u.nome} ${u.sobrenome}` : u.nome, tipo: 'usuario' as const })),
        ...(Array.isArray(rs) ? rs : []).map((r: RawPessoa) => ({ id: r._id, nome: r.sobrenome ? `${r.nome} ${r.sobrenome}` : r.nome, tipo: 'residente' as const })),
      ];
      setPessoas(lista);
    }).catch(() => {});
  }, []);

  async function handleSalvar() {
    if (!alterarCategoria && !alterarCompetencia && !alterarVinculo) {
      setErro('Selecione pelo menos um campo para alterar.');
      return;
    }

    if (alterarCompetencia && !competencia) {
      setErro('Informe o mês de referência.');
      return;
    }

    const update: Record<string, string | null> = {};
    if (alterarCategoria) update.categoriaId = categoriaId || null;
    if (alterarCompetencia) update.competencia = competencia;
    if (alterarVinculo) {
      update.vinculadoId = vinculadoId || null;
      update.vinculadoTipo = vinculadoTipo || null;
    }

    setLoading(true);
    setErro('');
    try {
      await S_financeiroMovimentacoes.updateMany(ids, update);
      onSuccess();
    } catch (err: any) {
      setErro(err.message || 'Erro ao atualizar.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Editar em lote —{' '}
            <span className="text-indigo-600">{ids.length}</span>{' '}
            movimentações
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{erro}</div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={alterarCategoria}
                onChange={(e) => setAlterarCategoria(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              Alterar categoria
            </label>
            {alterarCategoria && (
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm focus:outline-none"
              >
                <option value="">Sem categoria (limpar)</option>
                {categorias.map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={alterarCompetencia}
                onChange={(e) => setAlterarCompetencia(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              Alterar mês de referência
            </label>
            {alterarCompetencia && (
              <input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm focus:outline-none"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={alterarVinculo}
                onChange={(e) => setAlterarVinculo(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              Alterar pessoa vinculada
            </label>
            {alterarVinculo && (
              <PessoaCombobox
                pessoas={pessoas}
                value={vinculadoId}
                onChange={(id, tipo) => { setVinculadoId(id); setVinculadoTipo(tipo); }}
                placeholder="Pesquisar usuário ou residente... (vazio = limpar)"
              />
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded shadow disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
