import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import ImagemPadrao from '../../../public/images/lar felizidade logo transparente.png'
import Residentes_getAll from '@/actions/Residentes_getAll';
import Residentes_put_toggleIsAtivo from '@/actions/Residentes_put_toggleIsAtivo';
import { notifyError, notifySuccess } from '@/utils/Functions';
import Modalpadrao from '../ModalPadrao';
import { SINAL_VITAL_OPTIONS, validarSinalVital } from '@/models/sinaisvitaisv2.model';
import TextInputM2 from '../Formularios/TextInputM2';
import { Residentes_PUT_alterarLimites } from '@/actions/Residentes';

type ListaData = {
  apelido: string;
  cpf: string;
  createdAt: string;
  data_entrada: string;
  data_nascimento: string;
  foto_base64: string;
  genero: string;
  informacoes: string;
  is_ativo: string;
  nome: string;
  updatedAt: string;
  _id: string;
  limitesSinais?: { tipo: string; valorMin: string; valorMax: string }[];
}

const ListaResidentesAtivos = () => {
  const [listaUsuarios, setListaUsuarios] = useState<ListaData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [residenteSelecionado, setResidenteSelecionado] = useState<ListaData | null>(null);
  const [limites, setLimites] = useState<{ [tipo: string]: { valorMin: string; valorMax: string } }>({});
  const [savingLimites, setSavingLimites] = useState(false);

  useEffect(() => {
    async function fetchResidentes() {
      const residentes = await Residentes_getAll();
      setListaUsuarios(residentes);
    }
    fetchResidentes();
  }, []);

  const ativos = listaUsuarios.filter(r => r.is_ativo === 'S');
  const inativos = listaUsuarios.filter(r => r.is_ativo === 'N');

  const handleToggleIsAtivo = async (residente: ListaData) => {
    const result = await Residentes_put_toggleIsAtivo(residente._id, residente.is_ativo);
    if (result) {
      notifySuccess('Alterado com sucesso');
      setListaUsuarios(prev => prev.map(r => r._id === residente._id ? { ...r, is_ativo: r.is_ativo === 'S' ? 'N' : 'S' } : r));
    } else {
      notifyError('Não foi possível alterar.');
    }
  };

  const handleOpenModal = (residente: ListaData) => {
    setResidenteSelecionado(residente);
    const limitesObj: { [tipo: string]: { valorMin: string; valorMax: string } } = {};
    SINAL_VITAL_OPTIONS.forEach(opt => {
      const limite = residente.limitesSinais?.find((l: any) => l.tipo === opt.value);
      limitesObj[opt.value] = {
        valorMin: limite ? String(limite.valorMin) : '',
        valorMax: limite ? String(limite.valorMax) : '',
      };
    });
    setLimites(limitesObj);
    setModalOpen(true);
  };

  const handleLimiteChange = (tipo: string, campo: 'valorMin' | 'valorMax', value: string) => {
    setLimites(prev => ({ ...prev, [tipo]: { ...prev[tipo], [campo]: value } }));
  };

  const handleSalvarLimites = async () => {
    if (!residenteSelecionado) return;
    const limitesArray = Object.entries(limites).filter(([_, v]) => v.valorMin !== '' && v.valorMax !== '');

    for (const [tipo, { valorMin, valorMax }] of limitesArray) {
      const minV = validarSinalVital(tipo, valorMin);
      const maxV = validarSinalVital(tipo, valorMax);
      if (!minV.valido) { notifyError(`Mínimo inválido para ${tipo}: ${minV.erro}`); return; }
      if (!maxV.valido) { notifyError(`Máximo inválido para ${tipo}: ${maxV.erro}`); return; }
    }

    const limitesToSend = limitesArray.map(([tipo, v]) => ({ tipo, valorMin: v.valorMin, valorMax: v.valorMax }));
    try {
      setSavingLimites(true);
      const [, ok] = await Residentes_PUT_alterarLimites({ idResidente: residenteSelecionado._id, body: { limitesSinais: limitesToSend } });
      if (ok) { notifySuccess('Limites salvos!'); setModalOpen(false); }
      else notifyError('Erro ao salvar limites.');
    } catch {
      notifyError('Erro ao salvar limites.');
    } finally {
      setSavingLimites(false);
    }
  };

  const ResidenteRow = ({ r }: { r: ListaData }) => (
    <tr className='hover:bg-gray-50 transition-colors cursor-pointer' onClick={() => handleOpenModal(r)}>
      <td className='px-3 py-2.5 whitespace-nowrap'>
        <div className='flex items-center gap-2'>
          <Image className='rounded-full object-cover w-8 h-8 flex-shrink-0' width={32} height={32}
            src={r.foto_base64 || ImagemPadrao} alt={r.nome} />
          <div>
            <p className='text-sm font-medium text-gray-800'>{r.apelido || r.nome}</p>
            <p className='text-xs text-gray-400'>{r.nome}</p>
          </div>
        </div>
      </td>
      <td className='px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap'>{r.cpf}</td>
      <td className='px-3 py-2.5'>
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.is_ativo === 'S' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {r.is_ativo === 'S' ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className='px-3 py-2.5' onClick={e => { e.stopPropagation(); handleToggleIsAtivo(r); }}>
        <button className='text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50'>
          {r.is_ativo === 'S' ? 'Desativar' : 'Ativar'}
        </button>
      </td>
    </tr>
  );

  const TabelaHeader = () => (
    <thead className='bg-gray-50 text-gray-500 text-xs uppercase'>
      <tr>
        <th className='px-3 py-3 text-left'>Residente</th>
        <th className='px-3 py-3 text-left'>CPF</th>
        <th className='px-3 py-3 text-left'>Status</th>
        <th className='px-3 py-3 text-left'>Ação</th>
      </tr>
    </thead>
  );

  return (
    <div className='space-y-6'>

      {/* Ativos */}
      <div>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-sm font-semibold text-gray-700'>Residentes Ativos</h3>
          <span className='bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold'>{ativos.length}</span>
        </div>
        <div className='overflow-x-auto rounded-lg border border-gray-200'>
          <table className='w-full text-sm'>
            <TabelaHeader />
            <tbody className='divide-y divide-gray-100'>
              {ativos.length === 0 && (
                <tr><td colSpan={4} className='text-center py-8 text-gray-400 text-sm'>Nenhum residente ativo.</td></tr>
              )}
              {ativos.map(r => <ResidenteRow key={r._id} r={r} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inativos */}
      {inativos.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-gray-700'>Residentes Inativos</h3>
            <span className='bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold'>{inativos.length}</span>
          </div>
          <div className='overflow-x-auto rounded-lg border border-gray-200'>
            <table className='w-full text-sm'>
              <TabelaHeader />
              <tbody className='divide-y divide-gray-100'>
                {inativos.map(r => <ResidenteRow key={r._id} r={r} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de limites */}
      <Modalpadrao isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className='space-y-4'>
          <div>
            <h3 className='text-base font-bold text-gray-800'>Limites de Sinais Vitais</h3>
            {residenteSelecionado && (
              <p className='text-sm text-gray-500 mt-0.5'>{residenteSelecionado.apelido || residenteSelecionado.nome}</p>
            )}
          </div>

          <p className='text-xs text-gray-500'>Defina os valores mínimo e máximo aceitáveis para cada sinal vital. Deixe em branco para não monitorar.</p>

          <div className='divide-y divide-gray-100'>
            {SINAL_VITAL_OPTIONS.map(opt => (
              <div key={opt.value} className='py-2.5 flex flex-col sm:flex-row sm:items-center gap-2'>
                <span className='text-sm text-gray-700 font-medium w-full sm:w-36 flex-shrink-0'>{opt.label}</span>
                <div className='flex gap-2 flex-1 items-center'>
                  <div className='flex-1'>
                    <TextInputM2
                      label='Mín'
                      name={`min-${opt.value}`}
                      value={limites[opt.value]?.valorMin || ''}
                      onChange={e => handleLimiteChange(opt.value, 'valorMin', e.target.value)}
                    />
                  </div>
                  <div className='flex-1'>
                    <TextInputM2
                      label='Máx'
                      name={`max-${opt.value}`}
                      value={limites[opt.value]?.valorMax || ''}
                      onChange={e => handleLimiteChange(opt.value, 'valorMax', e.target.value)}
                    />
                  </div>
                  {opt.placeholder && (
                    <span className='text-xs text-gray-400 flex-shrink-0 hidden sm:block'>{opt.placeholder}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <button onClick={() => setModalOpen(false)}
              className='px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors'>
              Cancelar
            </button>
            <button onClick={handleSalvarLimites} disabled={savingLimites}
              className='px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors'>
              {savingLimites ? 'Salvando...' : 'Salvar Limites'}
            </button>
          </div>
        </div>
      </Modalpadrao>
    </div>
  );
};

export default ListaResidentesAtivos;
