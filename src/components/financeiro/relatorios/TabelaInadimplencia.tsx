import React from 'react';

interface Titulo {
  _id: string;
  descricao: string;
  vencimento: string;
  valorOriginal: number;
  saldo: number;
}

interface Props {
  titulos: Titulo[];
  total: number;
}

const fmt = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d?: string) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const diasVencido = (vencimento: string): number => {
  const hoje = new Date();
  const venc = new Date(vencimento + 'T00:00:00');
  const diff = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const TabelaInadimplencia: React.FC<Props> = ({ titulos, total }) => {
  if (!titulos || titulos.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-6">Nenhum título em inadimplência.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Vencimento</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor Original</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Saldo</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Dias Vencido</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {titulos.map((t) => (
            <tr key={t._id} className="hover:bg-red-50">
              <td className="px-4 py-2 text-sm text-gray-700">{t.descricao}</td>
              <td className="px-4 py-2 text-sm text-center text-gray-600">{formatDate(t.vencimento)}</td>
              <td className="px-4 py-2 text-sm text-right text-gray-700">{fmt(t.valorOriginal)}</td>
              <td className="px-4 py-2 text-sm text-right font-semibold text-red-600">{fmt(t.saldo)}</td>
              <td className="px-4 py-2 text-sm text-center">
                <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                  {diasVencido(t.vencimento)} dias
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-bold">
          <tr>
            <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">Total em Inadimplência</td>
            <td className="px-4 py-3 text-sm text-right text-red-700">{fmt(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TabelaInadimplencia;
