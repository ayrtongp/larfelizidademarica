import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { NumericFormat } from 'react-number-format';
import { parseInterPJ, LinhaImportada } from '@/utils/parsers/importacao/inter_pj';
import { T_Categoria } from '@/types/T_financeiroCategorias';

interface Conta {
  _id: string;
  nome: string;
  modeloImportacao?: string;
}

interface LinhaPreview extends LinhaImportada {
  id: number;
  selecionada: boolean;
  categoriaId?: string;
  observacoes?: string;
}

interface Props {
  contas: Conta[];
  onClose: () => void;
  onSuccess: () => void;
}

function lerComoData(file: File): Promise<any[][]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));

    if (isCsv) {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const sep = text.indexOf(';') !== -1 ? ';' : ',';
          const linhas = text.split(/\r?\n/);
          const data = linhas.map((l) => l.split(sep));
          resolve(data);
        } catch (err: any) { reject(err); }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: 'array', cellDates: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }));
        } catch (err: any) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

function parsearArquivo(file: File, modelo: string): Promise<LinhaImportada[]> {
  return lerComoData(file).then((data) => {
    if (modelo === 'inter_pj') return parseInterPJ(data);
    throw new Error(`Modelo de importação "${modelo}" não suportado.`);
  });
}

const ImportacaoExtrato: React.FC<Props> = ({ contas, onClose, onSuccess }) => {
  const [contaId, setContaId] = useState('');
  const [linhas, setLinhas] = useState<LinhaPreview[]>([]);
  const [erroParser, setErroParser] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');
  const [lastIdx, setLastIdx] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<T_Categoria[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const contaSelecionada = contas.find((c) => c._id === contaId);
  const contasComModelo = contas.filter((c) => c.modeloImportacao);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategorias(data);
        else if (Array.isArray(data?.categorias)) setCategorias(data.categorias);
      })
      .catch(() => {});
  }, []);

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !contaSelecionada?.modeloImportacao) return;

    setErroParser('');
    setLinhas([]);
    setLastIdx(null);
    setLoading(true);
    try {
      const resultado = await parsearArquivo(file, contaSelecionada.modeloImportacao);
      setLinhas(resultado.map((r, i) => ({ ...r, id: i, selecionada: true, categoriaId: '', observacoes: '' })));
    } catch (err: any) {
      setErroParser(err.message || 'Erro ao processar arquivo.');
    } finally {
      setLoading(false);
    }
  }

  function toggleLinha(idx: number, shiftKey: boolean) {
    setLinhas((prev) => {
      if (shiftKey && lastIdx !== null) {
        const from = Math.min(lastIdx, idx);
        const to = Math.max(lastIdx, idx);
        const novoValor = !prev[idx].selecionada;
        return prev.map((l, i) => (i >= from && i <= to ? { ...l, selecionada: novoValor } : l));
      }
      return prev.map((l, i) => (i === idx ? { ...l, selecionada: !l.selecionada } : l));
    });
    setLastIdx(idx);
  }

  function toggleTodas() {
    const todas = linhas.every((l) => l.selecionada);
    setLinhas((prev) => prev.map((l) => ({ ...l, selecionada: !todas })));
  }

  function editarCampo(id: number, campo: keyof LinhaPreview, valor: any) {
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  function removerLinha(id: number) {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleSalvar() {
    const selecionadas = linhas.filter((l) => l.selecionada);
    if (selecionadas.length === 0) return;

    setSalvando(true);
    setErroSalvar('');
    try {
      const res = await fetch('/api/Controller/C_financeiroMovimentacoes?type=importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contaFinanceiraId: contaId,
          movimentacoes: selecionadas.map(({ id, selecionada, ...rest }) => rest),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao salvar.');
      }
      const { inseridos } = await res.json();
      alert(`${inseridos} movimentação(ões) importada(s) com sucesso!`);
      onSuccess();
    } catch (err: any) {
      setErroSalvar(err.message || 'Erro ao salvar movimentações.');
    } finally {
      setSalvando(false);
    }
  }

  const selecionadasCount = linhas.filter((l) => l.selecionada).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Importar Extrato Bancário</h2>
            <p className="text-sm text-gray-500 mt-0.5">Faça upload do arquivo e confirme os dados antes de salvar</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Seleção de conta + upload */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Conta *</label>
              <select
                value={contaId}
                onChange={(e) => { setContaId(e.target.value); setLinhas([]); setErroParser(''); if (fileRef.current) fileRef.current.value = ''; }}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
              >
                <option value="">Selecione a conta...</option>
                {contasComModelo.map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}</option>
                ))}
              </select>
              {contasComModelo.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Nenhuma conta configurada com modelo de importação. Configure em Contas → Editar → Modelo de Importação.</p>
              )}
              {contaSelecionada?.modeloImportacao && (
                <p className="text-xs text-gray-400 mt-1">Modelo: <span className="font-medium text-gray-600">{contaSelecionada.modeloImportacao}</span></p>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Arquivo (CSV ou Excel) *</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={!contaSelecionada?.modeloImportacao}
                onChange={handleArquivo}
                className="block w-full text-sm text-gray-600 border border-gray-300 rounded py-1.5 px-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Erro parser */}
          {erroParser && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{erroParser}</div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-6 text-gray-500 text-sm">Processando arquivo...</div>
          )}

          {/* Preview table */}
          {linhas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {linhas.length} linha(s) encontrada(s) &mdash; {selecionadasCount} selecionada(s)
                </p>
                <span className="text-xs text-gray-400">Clique para editar · Shift+clique para selecionar em lote</span>
              </div>

              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-center w-8">
                        <input
                          type="checkbox"
                          checked={linhas.length > 0 && linhas.every((l) => l.selecionada)}
                          onChange={toggleTodas}
                          className="h-4 w-4"
                        />
                      </th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Data</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Tipo</th>
                      <th className="px-3 py-2 text-left">Histórico</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Valor</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Categoria</th>
                      <th className="px-3 py-2 text-left">Observações</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {linhas.map((linha, idx) => {
                      const tipoCategoria = linha.tipoMovimento === 'entrada' ? 'receita' : 'despesa';
                      const categoriasFiltradas = categorias.filter((c) => c.tipo === tipoCategoria && c.ativo);
                      return (
                        <tr
                          key={linha.id}
                          className={`${!linha.selecionada ? 'opacity-40 bg-gray-50' : 'hover:bg-indigo-50/30'} transition-colors`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={linha.selecionada}
                              onChange={() => {}}
                              onClick={(e) => { e.stopPropagation(); toggleLinha(idx, e.shiftKey); }}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </td>
                          {/* Data */}
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={linha.dataMovimento}
                              onChange={(e) => editarCampo(linha.id, 'dataMovimento', e.target.value)}
                              className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-32"
                            />
                          </td>
                          {/* Tipo */}
                          <td className="px-2 py-1.5">
                            <select
                              value={linha.tipoMovimento}
                              onChange={(e) => editarCampo(linha.id, 'tipoMovimento', e.target.value as any)}
                              className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 ${linha.tipoMovimento === 'entrada' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}
                            >
                              <option value="entrada">Entrada</option>
                              <option value="saida">Saída</option>
                              <option value="ajuste">Ajuste</option>
                            </select>
                          </td>
                          {/* Histórico */}
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={linha.historico}
                              onChange={(e) => editarCampo(linha.id, 'historico', e.target.value)}
                              className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full min-w-[160px]"
                            />
                          </td>
                          {/* Valor */}
                          <td className="px-2 py-1.5 text-right">
                            <NumericFormat
                              value={linha.valor}
                              thousandSeparator="."
                              decimalSeparator=","
                              decimalScale={2}
                              fixedDecimalScale
                              prefix="R$ "
                              onValueChange={(values) => editarCampo(linha.id, 'valor', values.floatValue ?? 0)}
                              className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-28 text-right"
                            />
                          </td>
                          {/* Categoria */}
                          <td className="px-2 py-1.5">
                            <select
                              value={linha.categoriaId ?? ''}
                              onChange={(e) => editarCampo(linha.id, 'categoriaId', e.target.value)}
                              className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full min-w-[130px]"
                            >
                              <option value="">— Categoria —</option>
                              {categoriasFiltradas.map((c) => (
                                <option key={c._id} value={c._id}>{c.nome}</option>
                              ))}
                            </select>
                          </td>
                          {/* Observações */}
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={linha.observacoes ?? ''}
                              onChange={(e) => editarCampo(linha.id, 'observacoes', e.target.value)}
                              placeholder="Observação..."
                              className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full min-w-[120px]"
                            />
                          </td>
                          {/* Remove */}
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => removerLinha(linha.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none"
                              title="Remover linha"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Erro salvar */}
          {erroSalvar && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{erroSalvar}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={selecionadasCount === 0 || salvando}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            {salvando ? 'Salvando...' : `Importar ${selecionadasCount > 0 ? selecionadasCount : ''} movimentação(ões)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportacaoExtrato;
