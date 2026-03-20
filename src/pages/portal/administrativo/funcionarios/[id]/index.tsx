import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { T_FuncionarioCLTComUsuario } from '@/types/T_funcionariosCLT';
import Tab_Contrato from '@/components/funcionarios/tabs/Tab_Contrato';
import Tab_DadosPessoais from '@/components/funcionarios/tabs/Tab_DadosPessoais';
import Tab_Beneficios from '@/components/funcionarios/tabs/Tab_Beneficios';
import Tab_DadosBancarios from '@/components/funcionarios/tabs/Tab_DadosBancarios';
import Tab_SaudeOcupacional from '@/components/funcionarios/tabs/Tab_SaudeOcupacional';
import Tab_ContatoEmergencia from '@/components/funcionarios/tabs/Tab_ContatoEmergencia';
import Tab_Demissao from '@/components/funcionarios/tabs/Tab_Demissao';
import GestaoArquivos from '@/components/Arquivos/GestaoArquivos';
import {
  FaUser, FaFileContract, FaIdCard, FaGift,
  FaUniversity, FaHeartbeat, FaFolder, FaPhone, FaUserTimes,
} from 'react-icons/fa';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  demitido: { label: 'Demitido', className: 'bg-red-100 text-red-800' },
  afastado: { label: 'Afastado', className: 'bg-yellow-100 text-yellow-800' },
  ferias: { label: 'Férias', className: 'bg-blue-100 text-blue-800' },
};

interface MenuTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const FuncionarioDetalhes = () => {
  const router = useRouter();
  const { id } = router.query;
  const { hasGroup, loading: loadingPermission } = useHasGroup('rh');
  const isAdmin = useIsAdmin();

  const [funcionario, setFuncionario] = useState<T_FuncionarioCLTComUsuario | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [classeAtiva, setClasseAtiva] = useState('menuVisaoGeral');

  const efeitoClasseAtiva = 'bg-slate-100 border-l-2 border-purple-500';

  const tabs: MenuTab[] = [
    { id: 'menuVisaoGeral', label: 'Visão Geral', icon: <FaUser />, color: 'text-blue-600' },
    { id: 'menuContrato', label: 'Contrato CLT', icon: <FaFileContract />, color: 'text-indigo-600' },
    { id: 'menuDadosPessoais', label: 'Dados Pessoais', icon: <FaIdCard />, color: 'text-gray-600' },
    { id: 'menuBeneficios', label: 'Benefícios', icon: <FaGift />, color: 'text-green-600' },
    { id: 'menuBancario', label: 'Dados Bancários', icon: <FaUniversity />, color: 'text-yellow-600' },
    { id: 'menuSaude', label: 'Saúde Ocupacional', icon: <FaHeartbeat />, color: 'text-red-600' },
    { id: 'menuDocumentos', label: 'Documentos', icon: <FaFolder />, color: 'text-fuchsia-600' },
    { id: 'menuEmergencia', label: 'Emergência', icon: <FaPhone />, color: 'text-orange-600' },
    ...(isAdmin ? [{ id: 'menuDemissao', label: 'Demissão / Status', icon: <FaUserTimes />, color: 'text-red-700' }] : []),
  ];

  const loadFuncionario = async (funcionarioId: string) => {
    try {
      setLoadingData(true);
      const data = await S_funcionariosCLT.getById(funcionarioId);
      setFuncionario(data);
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (id && typeof id === 'string' && hasGroup) {
      loadFuncionario(id);
    }
  }, [id, hasGroup]);

  if (loadingPermission) {
    return (
      <PermissionWrapper href="/portal">
        <PortalBase>
          <div className="col-span-full flex justify-center py-20">
            <p className="text-gray-500 text-sm">Verificando permissões...</p>
          </div>
        </PortalBase>
      </PermissionWrapper>
    );
  }

  if (!hasGroup) {
    return (
      <PermissionWrapper href="/portal">
        <PortalBase>
          <div className="col-span-full flex justify-center py-20 text-center">
            <div>
              <p className="text-xl font-semibold text-gray-700">Sem permissão</p>
              <p className="text-sm text-gray-500 mt-2">Você não tem acesso ao módulo de RH.</p>
            </div>
          </div>
        </PortalBase>
      </PermissionWrapper>
    );
  }

  const nomeCompleto = funcionario?.usuario ? `${funcionario.usuario.nome} ${funcionario.usuario.sobrenome}` : '—';
  const foto = funcionario?.usuario?.foto_cdn || funcionario?.usuario?.foto_base64;
  const statusInfo = funcionario ? (STATUS_CONFIG[funcionario.status] ?? { label: funcionario.status, className: 'bg-gray-100 text-gray-700' }) : null;

  return (
    <PermissionWrapper href="/portal/administrativo/funcionarios">
      <PortalBase>
        <div className="col-span-full">

          {loadingData || !funcionario ? (
            <div className="flex justify-center py-20">
              <p className="text-gray-500 text-sm">{loadingData ? 'Carregando...' : 'Funcionário não encontrado.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              {/* MENU ESQUERDO */}
              <div className="col-span-3 sm:col-span-1 bg-white">
                <div className="p-3 border shadow-md rounded-md">

                  {/* Avatar + nome */}
                  <div className="flex flex-row gap-3 items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {foto ? (
                        <Image src={foto} width={64} height={64} alt={nomeCompleto} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                          {nomeCompleto.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-base leading-tight">{nomeCompleto}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{funcionario.contrato?.cargo}</p>
                      {statusInfo && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu de abas */}
                  <ul className="flex flex-col gap-0.5">
                    {tabs.map((tab) => (
                      <li key={tab.id} id={tab.id}
                        onClick={() => setClasseAtiva(tab.id)}
                        className={`cursor-pointer flex px-2 py-1.5 flex-row items-center rounded ${classeAtiva === tab.id ? efeitoClasseAtiva : 'hover:bg-gray-50'}`}
                      >
                        <span className={`p-1 ${tab.color} w-8 text-sm`}>{tab.icon}</span>
                        <p className="ml-2 text-sm text-slate-700">{tab.label}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* PAINEL DIREITO */}
              <div className="col-span-3 sm:col-span-2 bg-white">
                <div className="px-5 pt-5 pb-2">
                  <h2 className="text-lg font-bold text-slate-700">
                    {tabs.find((t) => t.id === classeAtiva)?.label}
                  </h2>
                  <hr className="my-2" />
                </div>

                <div className="p-4">

                  {/* VISÃO GERAL */}
                  {classeAtiva === 'menuVisaoGeral' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <InfoCard label="Cargo" value={funcionario.contrato?.cargo} />
                        <InfoCard label="Setor" value={funcionario.contrato?.setor} />
                        <InfoCard label="Admissão" value={formatDateBR(funcionario.contrato?.dataAdmissao)} />
                        <InfoCard label="Salário Base" value={formatCurrency(funcionario.contrato?.salarioBase)} />
                        <InfoCard label="Carga Horária" value={`${funcionario.contrato?.cargaHorariaSemanal}h/semana`} />
                        <InfoCard label="Turno" value={funcionario.contrato?.turno?.replace('_', ' ')} />
                        <InfoCard label="CPF" value={funcionario.dadosPessoais?.cpf} />
                        <InfoCard label="PIS/PASEP" value={funcionario.pisPasep} />
                        <InfoCard label="Contrato" value={TIPOS_CONTRATO_LABELS[funcionario.contrato?.tipoContrato] ?? funcionario.contrato?.tipoContrato} />
                      </div>

                      {/* Alertas de ASO */}
                      {funcionario.saudeOcupacional?.asos?.some(a => isVencimentoProximo(a.dataVencimento) || isVencido(a.dataVencimento)) && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                          <strong>⚠ Atenção:</strong> Há ASO(s) vencido(s) ou com vencimento próximo. Acesse a aba <strong>Saúde Ocupacional</strong>.
                        </div>
                      )}

                      {/* Benefícios resumo */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Benefícios ativos</p>
                        <div className="flex flex-wrap gap-2">
                          {funcionario.beneficios?.valeTransporte && <Badge label="Vale Transporte" />}
                          {funcionario.beneficios?.valeAlimentacao && <Badge label="Vale Alimentação" />}
                          {funcionario.beneficios?.planoSaude && <Badge label="Plano de Saúde" />}
                          {funcionario.beneficios?.planoOdontologico && <Badge label="Odontológico" />}
                          {funcionario.beneficios?.seguroVida && <Badge label="Seguro de Vida" />}
                          {!funcionario.beneficios?.valeTransporte && !funcionario.beneficios?.valeAlimentacao && !funcionario.beneficios?.planoSaude && !funcionario.beneficios?.planoOdontologico && !funcionario.beneficios?.seguroVida && (
                            <span className="text-xs text-gray-400">Nenhum benefício cadastrado.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTRATO CLT */}
                  {classeAtiva === 'menuContrato' && (
                    <Tab_Contrato
                      funcionarioId={funcionario._id!}
                      contrato={funcionario.contrato}
                      onUpdate={(contrato) => setFuncionario((prev) => prev ? { ...prev, contrato } : prev)}
                    />
                  )}

                  {/* DADOS PESSOAIS */}
                  {classeAtiva === 'menuDadosPessoais' && (
                    <Tab_DadosPessoais
                      funcionarioId={funcionario._id!}
                      dadosPessoais={funcionario.dadosPessoais ?? { cpf: '' }}
                      endereco={funcionario.endereco ?? {}}
                      ctps={funcionario.ctps ?? {}}
                      pisPasep={funcionario.pisPasep}
                      onUpdate={(data) => setFuncionario((prev) => prev ? {
                        ...prev,
                        dadosPessoais: data.dadosPessoais,
                        endereco: data.endereco,
                        ctps: data.ctps,
                        pisPasep: data.pisPasep,
                      } : prev)}
                    />
                  )}

                  {/* BENEFÍCIOS */}
                  {classeAtiva === 'menuBeneficios' && (
                    <Tab_Beneficios
                      funcionarioId={funcionario._id!}
                      beneficios={funcionario.beneficios ?? { valeTransporte: false, valeAlimentacao: false, planoSaude: false, planoOdontologico: false, seguroVida: false }}
                      onUpdate={(beneficios) => setFuncionario((prev) => prev ? { ...prev, beneficios } : prev)}
                    />
                  )}

                  {/* DADOS BANCÁRIOS */}
                  {classeAtiva === 'menuBancario' && (
                    <Tab_DadosBancarios
                      funcionarioId={funcionario._id!}
                      dadosBancarios={funcionario.dadosBancarios ?? {}}
                      onUpdate={(dadosBancarios) => setFuncionario((prev) => prev ? { ...prev, dadosBancarios } : prev)}
                    />
                  )}

                  {/* SAÚDE OCUPACIONAL */}
                  {classeAtiva === 'menuSaude' && (
                    <Tab_SaudeOcupacional
                      funcionarioId={funcionario._id!}
                      saudeOcupacional={funcionario.saudeOcupacional ?? { asos: [] }}
                      onUpdate={(saudeOcupacional) => setFuncionario((prev) => prev ? { ...prev, saudeOcupacional } : prev)}
                    />
                  )}

                  {/* DOCUMENTOS */}
                  {classeAtiva === 'menuDocumentos' && funcionario._id && (
                    <GestaoArquivos
                      entityId={funcionario._id}
                      entityName={nomeCompleto}
                    />
                  )}

                  {/* EMERGÊNCIA */}
                  {classeAtiva === 'menuEmergencia' && (
                    <Tab_ContatoEmergencia
                      funcionarioId={funcionario._id!}
                      contatoEmergencia={funcionario.contatoEmergencia ?? {}}
                      onUpdate={(contatoEmergencia) => setFuncionario((prev) => prev ? { ...prev, contatoEmergencia } : prev)}
                    />
                  )}

                  {/* DEMISSÃO (apenas admin) */}
                  {classeAtiva === 'menuDemissao' && isAdmin && (
                    <Tab_Demissao
                      funcionarioId={funcionario._id!}
                      status={funcionario.status}
                      dataDemissao={funcionario.dataDemissao}
                      tipoDemissao={funcionario.tipoDemissao}
                      motivoDemissao={funcionario.motivoDemissao}
                      onUpdate={(data) => setFuncionario((prev) => prev ? { ...prev, ...data } : prev)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
};

// Helpers
const TIPOS_CONTRATO_LABELS: Record<string, string> = {
  experiencia: 'Experiência',
  prazo_indeterminado: 'Prazo Indeterminado',
  prazo_determinado: 'Prazo Determinado',
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

function isVencimentoProximo(dateStr?: string): boolean {
  if (!dateStr) return false;
  const vencimento = new Date(dateStr);
  const hoje = new Date();
  const diff = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

function isVencido(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const InfoCard: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="bg-gray-50 rounded p-2">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
  </div>
);

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">{label}</span>
);

export default FuncionarioDetalhes;
