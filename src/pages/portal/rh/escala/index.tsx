import React, { useCallback, useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import EscalaGrade from '@/components/escala/EscalaGrade';
import EscalaCalendario from '@/components/escala/EscalaCalendario';
import EquipeForm from '@/components/escala/EquipeForm';
import DiaDetalhePanel from '@/components/escala/DiaDetalhePanel';
import S_escala from '@/services/S_escala';
import S_escalaExcecoes from '@/services/S_escalaExcecoes';
import { T_Equipe } from '@/types/T_escala';
import { T_EscalaExcecao } from '@/types/T_escalaExcecao';
import { semanaDeData, formatDateISO } from '@/utils/escalaUtils';
import { useHasGroup } from '@/hooks/useHasGroup';
import { notifyError, notifySuccess } from '@/utils/Functions';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtData(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

export default function EscalaPage() {
  const { hasGroup: isRH } = useHasGroup('rh');
  const hoje = new Date();

  const [equipes, setEquipes]     = useState<T_Equipe[]>([]);
  const [excecoes, setExcecoes]   = useState<T_EscalaExcecao[]>([]);
  const [loading, setLoading]     = useState(true);

  const [aba, setAba]                     = useState<'semana' | 'mes'>('semana');
  const [filtroEquipeId, setFiltroEquipeId] = useState('');

  const [semanaBase, setSemanaBase] = useState<Date>(hoje);
  const semana = semanaDeData(semanaBase);

  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const [gerenciarAberto, setGerenciarAberto]   = useState(false);
  const [formEquipe, setFormEquipe]             = useState<T_Equipe | null | 'nova'>(null);
  const [salvandoEquipe, setSalvandoEquipe]     = useState(false);
  const [erroForm, setErroForm]                 = useState('');

  const [diaAberto, setDiaAberto]               = useState<string | null>(null);
  const [salvandoExc, setSalvandoExc]           = useState(false);

  // ── Equipes ────────────────────────────────────────────────────────────────
  const carregarEquipes = useCallback(async () => {
    setLoading(true);
    try {
      setEquipes(await S_escala.getAll());
    } catch {
      notifyError('Erro ao carregar equipes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarEquipes(); }, [carregarEquipes]);

  // ── Exceções — recarrega quando semana/mês muda ────────────────────────────
  const carregarExcecoes = useCallback(async () => {
    try {
      let inicio: string;
      let fim: string;
      if (aba === 'semana') {
        inicio = formatDateISO(semana[0]);
        fim    = formatDateISO(semana[6]);
      } else {
        const d1 = new Date(ano, mes - 1, 1);
        const d2 = new Date(ano, mes, 0);
        inicio = formatDateISO(d1);
        fim    = formatDateISO(d2);
      }
      setExcecoes(await S_escalaExcecoes.getByRange(inicio, fim));
    } catch {
      // silently ignore
    }
  }, [aba, semana[0].toISOString(), mes, ano]); // eslint-disable-line

  useEffect(() => { carregarExcecoes(); }, [carregarExcecoes]);

  // ── Navegação ──────────────────────────────────────────────────────────────
  const navSemana = (dir: number) => {
    setSemanaBase((b) => {
      const d = new Date(b);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const navMes = (dir: number) => {
    setMes((m) => {
      const novoMes = m + dir;
      if (novoMes < 1)  { setAno((a) => a - 1); return 12; }
      if (novoMes > 12) { setAno((a) => a + 1); return 1;  }
      return novoMes;
    });
  };

  // ── Equipes CRUD ───────────────────────────────────────────────────────────
  const handleSalvarEquipe = async (data: Omit<T_Equipe, '_id' | 'createdAt' | 'updatedAt'>) => {
    setErroForm('');
    setSalvandoEquipe(true);
    try {
      if (formEquipe && formEquipe !== 'nova') {
        await S_escala.atualizar(formEquipe._id!, { nome: data.nome, descricao: data.descricao, cor: data.cor, regra: data.regra });
        await S_escala.atualizarMembros(formEquipe._id!, data.membros);
      } else {
        await S_escala.criar(data);
      }
      await carregarEquipes();
      setFormEquipe(null);
      notifySuccess(formEquipe && formEquipe !== 'nova' ? 'Equipe atualizada!' : 'Equipe criada!');
    } catch (err: unknown) {
      setErroForm(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSalvandoEquipe(false);
    }
  };

  const handleToggleAtivo = async (equipe: T_Equipe) => {
    try {
      await S_escala.toggleAtivo(equipe._id!);
      await carregarEquipes();
    } catch {
      notifyError('Erro ao alterar status da equipe.');
    }
  };

  // ── Exceções CRUD ──────────────────────────────────────────────────────────
  const handleSalvarExcecao = async (exc: Omit<T_EscalaExcecao, '_id' | 'createdAt'>) => {
    setSalvandoExc(true);
    try {
      await S_escalaExcecoes.salvar(exc);
      await carregarExcecoes();
    } catch {
      notifyError('Erro ao salvar exceção.');
    } finally {
      setSalvandoExc(false);
    }
  };

  const handleRemoverExcecao = async (id: string) => {
    try {
      await S_escalaExcecoes.remover(id);
      await carregarExcecoes();
    } catch {
      notifyError('Erro ao remover exceção.');
    }
  };

  const equipesAtivas = equipes.filter((e) => e.ativo);

  return (
    <PortalBase>
      <div className="col-span-full w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Escala de Colaboradores</h1>
          <div className="flex items-center gap-2">
            <select
              value={filtroEquipeId}
              onChange={(e) => setFiltroEquipeId(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Todas as equipes</option>
              {equipesAtivas.map((e) => (
                <option key={e._id} value={e._id}>{e.nome}</option>
              ))}
            </select>
            {isRH && (
              <button
                onClick={() => setGerenciarAberto(true)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              >
                Gerenciar Equipes
              </button>
            )}
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {(['semana', 'mes'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                ${aba === a ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {a === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando escala...</div>
        ) : (
          <>
            {/* Navegação */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => aba === 'semana' ? navSemana(-1) : navMes(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="text-sm font-semibold text-gray-700">
                {aba === 'semana'
                  ? `${fmtData(semana[0])} – ${fmtData(semana[6])} ${semana[0].getFullYear()}`
                  : `${MESES[mes - 1]} ${ano}`}
              </span>

              <button
                onClick={() => aba === 'semana' ? navSemana(1) : navMes(1)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {aba === 'semana' && (
              <EscalaGrade
                equipes={equipes}
                semana={semana}
                filtroEquipeId={filtroEquipeId}
                excecoes={excecoes}
                onClickDia={setDiaAberto}
              />
            )}
            {aba === 'mes' && (
              <EscalaCalendario
                equipes={equipes}
                ano={ano}
                mes={mes}
                filtroEquipeId={filtroEquipeId}
                excecoes={excecoes}
                onClickDia={setDiaAberto}
              />
            )}
          </>
        )}
      </div>

      {/* Modal Gerenciar Equipes */}
      {gerenciarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Gerenciar Equipes</h2>
              <button onClick={() => setGerenciarAberto(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {equipes.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma equipe cadastrada.</p>
              )}
              {equipes.map((eq) => (
                <div key={eq._id} className={`flex items-center gap-3 p-3 rounded-lg border ${eq.ativo ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: eq.cor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{eq.nome}</p>
                    <p className="text-xs text-gray-400">
                      {eq.membros.length} membro{eq.membros.length !== 1 ? 's' : ''} · {eq.ativo ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { setFormEquipe(eq); setGerenciarAberto(false); }}
                      className="px-2.5 py-1 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleAtivo(eq)}
                      className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {eq.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => { setFormEquipe('nova'); setGerenciarAberto(false); }}
                className="w-full py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
              >
                + Nova Equipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EquipeForm */}
      {formEquipe !== null && (
        <EquipeForm
          equipe={formEquipe === 'nova' ? undefined : formEquipe}
          onSalvar={handleSalvarEquipe}
          onFechar={() => { setFormEquipe(null); setErroForm(''); }}
          salvando={salvandoEquipe}
          erro={erroForm}
        />
      )}

      {/* DiaDetalhePanel */}
      {diaAberto && (
        <DiaDetalhePanel
          data={diaAberto}
          equipes={equipes}
          excecoes={excecoes}
          onSalvar={handleSalvarExcecao}
          onRemover={handleRemoverExcecao}
          onFechar={() => setDiaAberto(null)}
          salvando={salvandoExc}
        />
      )}
    </PortalBase>
  );
}
