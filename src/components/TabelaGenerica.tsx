import React, { useState, useMemo } from 'react';
import Modalpadrao from './ModalPadrao';

interface ColunaConfig {
    key: string;
    label?: string;
}

interface TabelaGenericaProps {
    dados: any[];
    colunas: ColunaConfig[];
    tituloModal?: string;
    ignorarCamposModal?: string[];
    rowsPerPage?: number;
}

const TabelaGenerica: React.FC<TabelaGenericaProps> = ({ dados, colunas, tituloModal = 'Detalhes', ignorarCamposModal = [], rowsPerPage = 10 }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [itemSelecionado, setItemSelecionado] = useState<any>(null);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [itensPorPagina] = useState(rowsPerPage);
    const [ordenarPor, setOrdenarPor] = useState<string>('');
    const [ordemAsc, setOrdemAsc] = useState(true);
    const [filtro, setFiltro] = useState('');

    const handleOpenModal = (item: any) => {
        setItemSelecionado(item);
        setModalOpen(true);
    };

    const dadosFiltrados = useMemo(() => {
        return dados.filter((item) =>
            colunas.some((col) => String(item[col.key] || '').toLowerCase().includes(filtro.toLowerCase()))
        );
    }, [dados, filtro, colunas]);

    const dadosOrdenados = useMemo(() => {
        if (!ordenarPor) return dadosFiltrados;
        return [...dadosFiltrados].sort((a, b) => {
            if (a[ordenarPor] < b[ordenarPor]) return ordemAsc ? -1 : 1;
            if (a[ordenarPor] > b[ordenarPor]) return ordemAsc ? 1 : -1;
            return 0;
        });
    }, [dadosFiltrados, ordenarPor, ordemAsc]);

    const dadosPaginados = useMemo(() => {
        const inicio = (paginaAtual - 1) * itensPorPagina;
        return dadosOrdenados.slice(inicio, inicio + itensPorPagina);
    }, [dadosOrdenados, paginaAtual, itensPorPagina]);

    const totalPaginas = Math.ceil(dadosOrdenados.length / itensPorPagina);

    const handleOrdenar = (coluna: string) => {
        if (ordenarPor === coluna) {
            setOrdemAsc(!ordemAsc);
        } else {
            setOrdenarPor(coluna);
            setOrdemAsc(true);
        }
    };

    return (
        <div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
            <input
                type='text'
                placeholder='Filtrar...'
                className='mb-2 p-1 border rounded'
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />
            <table className='table-auto w-full text-xs bg-white'>
                <thead className='uppercase'>
                    <tr className='bg-black text-white font-bold'>
                        {colunas.map((col) => (
                            <th
                                key={col.key}
                                className='px-2 py-1 cursor-pointer'
                                onClick={() => handleOrdenar(col.key)}
                            >
                                {col.label || col.key} {ordenarPor === col.key ? (ordemAsc ? '▲' : '▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dadosPaginados.map((linha, index) => (
                        <tr
                            onClick={() => handleOpenModal(linha)}
                            key={index}
                            className={`border-b cursor-pointer ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                        >
                            {colunas.map((col) => (
                                <td key={col.key} className='px-2 py-1 whitespace-nowrap'>
                                    {linha[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className='flex justify-between items-center mt-2'>
                <button
                    className='px-2 py-1 bg-gray-300 rounded'
                    onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                    disabled={paginaAtual === 1}
                >
                    Anterior
                </button>
                <span>Página {paginaAtual} de {totalPaginas}</span>
                <button
                    className='px-2 py-1 bg-gray-300 rounded'
                    onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                >
                    Próxima
                </button>
            </div>

            <Modalpadrao isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <div className="p-2">
                    <h3 className="font-bold mb-2">{tituloModal}</h3>
                    {itemSelecionado && (
                        <div className="space-y-1">
                            {Object.entries(itemSelecionado).map(([chave, valor]) => (
                                ignorarCamposModal.includes(chave) ? null : (
                                    <p key={chave}>
                                        <strong>{chave}:</strong> {String(valor)}
                                    </p>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </Modalpadrao>
        </div>
    );
};

export default TabelaGenerica;
