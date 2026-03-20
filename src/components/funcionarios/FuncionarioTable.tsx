import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { T_FuncionarioCLTComUsuario } from '@/types/T_funcionariosCLT';

interface Props {
  funcionarios: T_FuncionarioCLTComUsuario[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  demitido: { label: 'Demitido', className: 'bg-red-100 text-red-800' },
  afastado: { label: 'Afastado', className: 'bg-yellow-100 text-yellow-800' },
  ferias: { label: 'Férias', className: 'bg-blue-100 text-blue-800' },
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

const FuncionarioTable: React.FC<Props> = ({ funcionarios }) => {
  if (!funcionarios.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Nenhum funcionário encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Funcionário</th>
            <th className="px-4 py-3">Cargo</th>
            <th className="px-4 py-3">Setor</th>
            <th className="px-4 py-3">Admissão</th>
            <th className="px-4 py-3">Salário Base</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {funcionarios.map((f) => {
            const nome = f.usuario ? `${f.usuario.nome} ${f.usuario.sobrenome}` : '—';
            const foto = f.usuario?.foto_cdn || f.usuario?.foto_base64;
            const statusInfo = statusConfig[f.status] ?? { label: f.status, className: 'bg-gray-100 text-gray-700' };

            return (
              <tr key={f._id} className="hover:bg-gray-50">
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
                    <span className="font-medium text-gray-800">{nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{f.contrato?.cargo || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{f.contrato?.setor || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateBR(f.contrato?.dataAdmissao)}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(f.contrato?.salarioBase)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/portal/administrativo/funcionarios/${f._id}`}
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

export default FuncionarioTable;
