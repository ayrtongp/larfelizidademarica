import React, { useEffect, useRef, useState } from 'react';

export interface PessoaItem {
  id: string;
  nome: string;
  tipo: 'usuario' | 'residente';
}

interface Props {
  pessoas: PessoaItem[];
  value: string; // id selecionado
  onChange: (id: string, tipo: 'usuario' | 'residente' | '') => void;
  placeholder?: string;
  className?: string;
}

const TIPO_LABEL: Record<string, string> = { usuario: 'Usuário', residente: 'Residente' };
const TIPO_BADGE: Record<string, string> = {
  usuario: 'bg-indigo-100 text-indigo-700',
  residente: 'bg-emerald-100 text-emerald-700',
};

export default function PessoaCombobox({ pessoas, value, onChange, placeholder = 'Pesquisar pessoa...', className }: Props) {
  const selecionada = pessoas.find((p) => p.id === value) ?? null;
  const [query, setQuery] = useState('');
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtradas = query.trim()
    ? pessoas.filter((p) => p.nome.toLowerCase().includes(query.toLowerCase().trim()))
    : pessoas;

  function selecionar(pessoa: PessoaItem) {
    onChange(pessoa.id, pessoa.tipo);
    setAberto(false);
    setQuery('');
  }

  function limpar(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('', '');
    setQuery('');
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div
        className="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm bg-white flex items-center gap-2 cursor-pointer focus-within:ring-1 focus-within:ring-indigo-400 focus-within:border-indigo-400"
        onClick={() => { setAberto(true); }}
      >
        {selecionada && !aberto ? (
          <>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TIPO_BADGE[selecionada.tipo]}`}>
              {TIPO_LABEL[selecionada.tipo]}
            </span>
            <span className="flex-1 truncate">{selecionada.nome}</span>
            <button
              type="button"
              onClick={limpar}
              className="text-gray-400 hover:text-gray-600 text-base leading-none flex-shrink-0"
            >
              &times;
            </button>
          </>
        ) : (
          <input
            autoFocus={aberto}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAberto(true); }}
            onFocus={() => setAberto(true)}
            placeholder={selecionada ? selecionada.nome : placeholder}
            className="flex-1 outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
          />
        )}
      </div>

      {aberto && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto text-sm">
          {filtradas.length === 0 ? (
            <li className="px-3 py-2 text-gray-400 text-xs">Nenhum resultado encontrado.</li>
          ) : (
            filtradas.map((p) => (
              <li
                key={p.id}
                onMouseDown={() => selecionar(p)}
                className={`px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-indigo-50 ${value === p.id ? 'bg-indigo-50 font-medium' : ''}`}
              >
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${TIPO_BADGE[p.tipo]}`}>
                  {TIPO_LABEL[p.tipo]}
                </span>
                <span className="truncate">{p.nome}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
