import React from 'react';
import { T_ListaCompras, TIPO_LISTA_CONFIG } from '@/types/T_listaCompras';
import StatusBadgeLista from './StatusBadgeLista';
import { formatDateBR } from '@/utils/Functions';
import { useRouter } from 'next/router';

interface Props {
  lista: T_ListaCompras;
  onUsarComoModelo: (lista: T_ListaCompras) => void;
}

const CardLista: React.FC<Props> = ({ lista, onUsarComoModelo }) => {
  const router = useRouter();
  const tipoCfg = TIPO_LISTA_CONFIG[lista.tipo];
  const comprados = lista.itens.filter((i) => i.comprado).length;
  const total = lista.itens.length;
  const progressoPct = total > 0 ? Math.round((comprados / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">

      {/* Header badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoCfg.className}`}>
          {tipoCfg.emoji} {tipoCfg.label}
        </span>
        <StatusBadgeLista status={lista.status} />
      </div>

      {/* Título */}
      <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
        {lista.titulo}
      </h3>

      {/* Meta info */}
      <div className="space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDateBR(lista.data)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{lista.criadoPorNome || 'Nutricionista'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>{total} {total === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>

      {/* Barra de progresso (só quando há itens) */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-green-400 h-1.5 rounded-full transition-all"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{comprados}/{total} comprados</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => router.push(`/portal/suprimentos/listas/${lista._id}`)}
          className="flex-1 text-xs py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
        >
          Ver lista
        </button>
        <button
          onClick={() => onUsarComoModelo(lista)}
          className="flex-1 text-xs py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors"
        >
          Usar como modelo
        </button>
      </div>
    </div>
  );
};

export default CardLista;
