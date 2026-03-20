import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { T_IdosoDetalhesComUsuario } from '@/types/T_idosoDetalhes';

interface Props {
  idosos: T_IdosoDetalhesComUsuario[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo:     { label: 'Ativo',     className: 'bg-green-100 text-green-800' },
  alta:      { label: 'Alta',      className: 'bg-blue-100 text-blue-800' },
  falecido:  { label: 'Falecido',  className: 'bg-gray-200 text-gray-700' },
  afastado:  { label: 'Afastado',  className: 'bg-yellow-100 text-yellow-800' },
};

const modalidadeLabel: Record<string, string> = {
  residencia_fixa:       'Residência Fixa',
  residencia_temporaria: 'Residência Temp.',
  centro_dia:            'Centro Dia',
  hotelaria:             'Hotelaria',
};

function formatDateBR(dateStr?: string) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

const IdosoTable: React.FC<Props> = ({ idosos }) => {
  if (!idosos.length) {
    return <div className="text-center py-16 text-gray-400 text-sm">Nenhum idoso encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Idoso</th>
            <th className="px-4 py-3">Prontuário</th>
            <th className="px-4 py-3">Modalidade</th>
            <th className="px-4 py-3">Admissão</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {idosos.map((i) => {
            const nome = i.usuario ? `${i.usuario.nome} ${i.usuario.sobrenome}` : '—';
            const foto = i.usuario?.foto_cdn || i.usuario?.foto_base64;
            const statusInfo = statusConfig[i.status] ?? { label: i.status, className: 'bg-gray-100 text-gray-700' };

            return (
              <tr key={i._id} className="hover:bg-gray-50">
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
                <td className="px-4 py-3 text-gray-600">{i.admissao?.numProntuario || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{modalidadeLabel[i.admissao?.modalidadePrincipal] || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateBR(i.admissao?.dataEntrada)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/portal/administrativo/idosos/${i._id}`}
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

export default IdosoTable;
