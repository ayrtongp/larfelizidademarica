import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { T_PrestadorServicoComUsuario } from '@/types/T_prestadoresServico';

interface Props {
  prestadores: T_PrestadorServicoComUsuario[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo:    { label: 'Ativo',    className: 'bg-green-100 text-green-800' },
  inativo:  { label: 'Inativo',  className: 'bg-red-100 text-red-800' },
  suspenso: { label: 'Suspenso', className: 'bg-yellow-100 text-yellow-800' },
};

const tipoCobrancaLabel: Record<string, string> = {
  hora:    'Por hora',
  mensal:  'Mensal',
  fixo:    'Fixo',
  diaria:  'Diária',
};

const PrestadorTable: React.FC<Props> = ({ prestadores }) => {
  if (!prestadores.length) {
    return <div className="text-center py-16 text-gray-400 text-sm">Nenhum prestador encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Prestador</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Serviço</th>
            <th className="px-4 py-3">Cobrança</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {prestadores.map((p) => {
            const nome = p.usuario ? `${p.usuario.nome} ${p.usuario.sobrenome}` : '—';
            const foto = p.usuario?.foto_cdn || p.usuario?.foto_base64;
            const statusInfo = statusConfig[p.status] ?? { label: p.status, className: 'bg-gray-100 text-gray-700' };

            return (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {foto ? (
                        <Image src={foto} width={32} height={32} alt={nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                          {nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{nome}</p>
                      <p className="text-xs text-gray-400">{p.tipoPessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.tipoPessoa === 'pj' ? (p.dados?.nomeFantasia || p.dados?.razaoSocial || '—') : (p.dados?.cpf ? 'PF' : '—')}
                </td>
                <td className="px-4 py-3 text-gray-700">{p.contrato?.tipoServico || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{tipoCobrancaLabel[p.contrato?.tipoCobranca] || '—'}</td>
                <td className="px-4 py-3 text-gray-700">
                  {p.contrato?.valor != null
                    ? p.contrato.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/portal/administrativo/prestadores/${p._id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                    Ver
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrestadorTable;
