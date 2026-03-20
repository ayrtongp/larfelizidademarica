import axios from 'axios';
import React, { useEffect, useState } from 'react'
import RelResidentesMes from '@/utils/docxtemplater/relResidentesMes';
import { FaCalendarAlt, FaFileDownload, FaSearch } from 'react-icons/fa';

interface ArrayResidentes {
  residente_id: string;
  resultados: any;
}

const MESES: { [key: string]: number } = {
  janeiro: 0, fevereiro: 1, março: 2, abril: 3,
  maio: 4, junho: 5, julho: 6, agosto: 7,
  setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.toLocaleString('pt-BR', { month: 'long' })} / ${d.getFullYear()}`;
    const value = `${d.toLocaleString('pt-BR', { month: 'long' }).toLowerCase()}/${d.getFullYear()}`;
    options.push({ label, value });
  }
  return options;
}

function mesLabelFromValue(value: string) {
  if (!value) return null;
  const [mes, ano] = value.split('/');
  const n = MESES[mes];
  if (n === undefined) return null;
  const d = new Date(Number(ano), n, 1);
  return d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

const RelZipAnotEnf = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [relatorioData, setRelatorioData] = useState<ArrayResidentes[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMonth) return;
    const [mes, ano] = selectedMonth.split('/');
    const n = MESES[mes];
    if (n === undefined) return;
    const first = new Date(Number(ano), n, 1);
    const last = new Date(Number(ano), n + 1, 0);
    setDataInicial(formatDate(first));
    setDataFinal(formatDate(last));
    setRelatorioData(null);
  }, [selectedMonth]);

  const handleGerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataInicial || !dataFinal) return;
    setLoading(true);
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        axios.get(`/api/Controller/AnotacoesEnfermagemController?type=getBetweenDates&dataInicio=${dataInicial}&dataFim=${dataFinal}`),
        axios.get(`/api/Controller/SinaisVitaisController?type=getBetweenDates&dataInicio=${dataInicial}&dataFim=${dataFinal}`),
        axios.get(`/api/Controller/ResidentesController?type=getAll`),
        axios.get(`/api/Controller/Usuario?type=getProfissionais`),
        axios.get(`/api/Controller/EvolucaoController?type=getBetweenDates&dataInicio=${dataInicial}&dataFim=${dataFinal}`),
      ]);

      const abrev = (dados: any[]) => dados.map((item: any) => {
        const { usuario_nome, ...rest } = item;
        if (!usuario_nome) return item;
        const parts = usuario_nome.split(' ');
        return { usuario_nome: `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`, ...rest };
      });

      const anotacoes = abrev(r1.data);
      const sinais = abrev(r2.data);
      const evolucoes = abrev(r5.data).sort((a: any, b: any) => new Date(b.dataEvolucao).getTime() - new Date(a.dataEvolucao).getTime());

      const residenteMap = new Map(r3.data.map((r: any) => [r._id, { nome: r.nome, cpf: r.cpf }]));
      const profMap = new Map<string, { nome: string; registro: string }>(r4.data.map((p: any) => [p._id, { nome: `${p.nome} ${p.sobrenome}`, registro: `${p.funcao} | ${p.registro}` }]));

      const allProfIds = Array.from(new Set<string>([
        ...anotacoes.map((i: any) => i.usuario_id),
        ...sinais.map((i: any) => i.usuario_id),
        ...evolucoes.map((i: any) => i.usuario_id),
      ]));
      const profissionaisFiltrados = Array.from(profMap.entries())
        .filter(([id]) => allProfIds.includes(id))
        .map(([id, info]) => ({ ...info, _id: id }));

      const uniqueResIds = Array.from(new Set(anotacoes.map((i: any) => i.residente_id)));
      const arraysPorResidente = uniqueResIds.map((resId: any) => ({
        residente_id: resId as string,
        residente_info: residenteMap.get(resId),
        profissionais: profissionaisFiltrados,
        resultados: anotacoes.filter((i: any) => i.residente_id === resId),
        sinais: sinais.filter((i: any) => i.residente_id === resId),
        evolucoes: evolucoes.filter((i: any) => i.residente_id === resId),
      }));

      setRelatorioData(arraysPorResidente);
    } finally {
      setLoading(false);
    }
  };

  const handleBaixar = () => {
    if (relatorioData) RelResidentesMes(relatorioData, dataInicial, dataFinal);
  };

  const mesLabel = mesLabelFromValue(selectedMonth);
  const monthOptions = generateMonthOptions();

  return (
    <div className='space-y-5'>
      <div>
        <p className='text-sm text-gray-500 mb-4'>
          Selecione um mês para gerar o relatório consolidado de anotações de enfermagem, sinais vitais e evoluções multidisciplinares.
        </p>

        {/* Seleção de mês */}
        <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-end'>
          <div className='w-full sm:w-64'>
            <label className='block text-xs text-gray-600 mb-1 font-medium'>
              <FaCalendarAlt className='inline mr-1 text-indigo-400' />
              Mês de referência
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500'
            >
              <option value='' disabled>Selecione um mês</option>
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGerar as any}
            disabled={!selectedMonth || loading}
            className='flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded transition-colors'
          >
            <FaSearch size={13} />
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {/* Período selecionado */}
      {dataInicial && dataFinal && (
        <div className='flex flex-wrap gap-3'>
          <div className='bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs text-gray-600'>
            <span className='font-semibold text-gray-500 uppercase tracking-wider'>Período</span>
            <p className='mt-0.5 font-medium text-gray-800 capitalize'>{mesLabel}</p>
          </div>
          {relatorioData !== null && (
            <div className='bg-green-50 border border-green-200 rounded px-3 py-2 text-xs text-green-700'>
              <span className='font-semibold uppercase tracking-wider'>Registros</span>
              <p className='mt-0.5 font-medium'>{relatorioData.length} residente(s) com dados</p>
            </div>
          )}
        </div>
      )}

      {/* Download */}
      {relatorioData !== null && (
        <div className='border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3'>
          <div>
            <p className='text-sm font-semibold text-green-800'>Relatório pronto para download</p>
            <p className='text-xs text-green-600 mt-0.5'>
              {relatorioData.length} residente(s) · período: {mesLabel}
            </p>
          </div>
          <button
            onClick={handleBaixar}
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors'
          >
            <FaFileDownload size={14} />
            Baixar Documentos
          </button>
        </div>
      )}

      {loading && (
        <div className='flex items-center justify-center py-10 text-gray-400 text-sm'>
          Buscando dados...
        </div>
      )}
    </div>
  );
};

export default RelZipAnotEnf;
