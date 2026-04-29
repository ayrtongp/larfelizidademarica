import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import S_prestadoresServico from '@/services/S_prestadoresServico';
import { T_PrestadorServicoComUsuario } from '@/types/T_prestadoresServico';
import Tab_DadosGerais from '@/components/prestadores/tabs/Tab_DadosGerais';
import Tab_Contrato from '@/components/prestadores/tabs/Tab_Contrato';
import Tab_DadosBancarios from '@/components/prestadores/tabs/Tab_DadosBancarios';
import GestaoArquivos from '@/components/Arquivos/GestaoArquivos';
import { notifyError, notifySuccess } from '@/utils/Functions';
import {
  FaUser, FaFileContract, FaUniversity, FaFolder, FaToggleOn,
} from 'react-icons/fa';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativo:    { label: 'Ativo',    className: 'bg-green-100 text-green-800' },
  inativo:  { label: 'Inativo',  className: 'bg-red-100 text-red-800' },
  suspenso: { label: 'Suspenso', className: 'bg-yellow-100 text-yellow-800' },
};

const TIPOS_COBRANCA_LABELS: Record<string, string> = {
  hora:   'Por hora',
  mensal: 'Mensal',
  fixo:   'Valor fixo',
  diaria: 'Diária',
};

interface MenuTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PrestadorDetalhes = () => {
  const router = useRouter();
  const { id } = router.query;
  const { hasGroup, loading: loadingPermission } = useHasGroup('rh');
  const isAdmin = useIsAdmin();

  const [prestador, setPrestador] = useState<T_PrestadorServicoComUsuario | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [classeAtiva, setClasseAtiva] = useState('menuVisaoGeral');
  const [savingStatus, setSavingStatus] = useState(false);

  const efeitoClasseAtiva = 'bg-slate-100 border-l-2 border-purple-500';

  const tabs: MenuTab[] = [
    { id: 'menuVisaoGeral',  label: 'Visão Geral',     icon: <FaUser />,         color: 'text-blue-600' },
    { id: 'menuDadosGerais', label: 'Dados Gerais',    icon: <FaUser />,         color: 'text-gray-600' },
    { id: 'menuContrato',    label: 'Contrato',         icon: <FaFileContract />, color: 'text-indigo-600' },
    { id: 'menuBancario',    label: 'Dados Bancários',  icon: <FaUniversity />,   color: 'text-yellow-600' },
    { id: 'menuDocumentos',  label: 'Documentos',       icon: <FaFolder />,       color: 'text-fuchsia-600' },
    ...(isAdmin ? [{ id: 'menuStatus', label: 'Status', icon: <FaToggleOn />, color: 'text-red-600' }] : []),
  ];

  const loadPrestador = async (prestadorId: string) => {
    try {
      setLoadingData(true);
      const data = await S_prestadoresServico.getById(prestadorId);
      setPrestador(data);
    } catch (error) {
      console.error('Erro ao carregar prestador:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (id && typeof id === 'string' && hasGroup) {
      loadPrestador(id);
    }
  }, [id, hasGroup]);

  const handleStatusChange = async (novoStatus: 'ativo' | 'inativo' | 'suspenso') => {
    if (!prestador?._id) return;
    try {
      setSavingStatus(true);
      await S_prestadoresServico.updateStatus(prestador._id, novoStatus);
      setPrestador((prev) => prev ? { ...prev, status: novoStatus } : prev);
      notifySuccess('Status atualizado!');
    } catch {
      notifyError('Erro ao atualizar status.');
    } finally {
      setSavingStatus(false);
    }
  };

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

  const nomeCompleto = prestador?.usuario ? `${prestador.usuario.nome} ${prestador.usuario.sobrenome}` : '—';
  const foto = prestador?.usuario?.foto_cdn || prestador?.usuario?.foto_base64;
  const statusInfo = prestador ? (STATUS_CONFIG[prestador.status] ?? { label: prestador.status, className: 'bg-gray-100 text-gray-700' }) : null;

  return (
    <PermissionWrapper href="/portal/administrativo/prestadores" groups={['rh']}>
      <PortalBase>
        <div className="col-span-full">

          {loadingData || !prestador ? (
            <div className="flex justify-center py-20">
              <p className="text-gray-500 text-sm">{loadingData ? 'Carregando...' : 'Prestador não encontrado.'}</p>
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
                      <p className="text-xs text-gray-500 mt-0.5">{prestador.contrato?.tipoServico}</p>
                      <p className="text-xs text-gray-400">{prestador.tipoPessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
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
                      <li key={tab.id}
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
                        <InfoCard label="Tipo de Serviço" value={prestador.contrato?.tipoServico} />
                        <InfoCard label="Tipo de Cobrança" value={TIPOS_COBRANCA_LABELS[prestador.contrato?.tipoCobranca]} />
                        <InfoCard label="Valor" value={prestador.contrato?.valor != null
                          ? prestador.contrato.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : undefined} />
                        <InfoCard label="Início" value={formatDateBR(prestador.contrato?.dataInicio)} />
                        {prestador.contrato?.dataFim && <InfoCard label="Fim" value={formatDateBR(prestador.contrato.dataFim)} />}
                        <InfoCard label="Emite NF" value={prestador.contrato?.emiteNF ? 'Sim' : 'Não'} />
                        {prestador.tipoPessoa === 'pj' && (
                          <>
                            <InfoCard label="Razão Social" value={prestador.dados?.razaoSocial} />
                            <InfoCard label="CNPJ" value={prestador.dados?.cnpj} />
                          </>
                        )}
                        {prestador.tipoPessoa === 'pf' && (
                          <InfoCard label="CPF" value={prestador.dados?.cpf} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* DADOS GERAIS */}
                  {classeAtiva === 'menuDadosGerais' && (
                    <Tab_DadosGerais
                      prestadorId={prestador._id!}
                      tipoPessoa={prestador.tipoPessoa}
                      dados={prestador.dados ?? {}}
                      endereco={prestador.endereco ?? {}}
                      onUpdate={(data) => setPrestador((prev) => prev ? { ...prev, ...data } : prev)}
                    />
                  )}

                  {/* CONTRATO */}
                  {classeAtiva === 'menuContrato' && (
                    <Tab_Contrato
                      prestadorId={prestador._id!}
                      contrato={prestador.contrato}
                      onUpdate={(contrato) => setPrestador((prev) => prev ? { ...prev, contrato } : prev)}
                    />
                  )}

                  {/* DADOS BANCÁRIOS */}
                  {classeAtiva === 'menuBancario' && (
                    <Tab_DadosBancarios
                      prestadorId={prestador._id!}
                      dadosBancarios={prestador.dadosBancarios ?? {}}
                      onUpdate={(dadosBancarios) => setPrestador((prev) => prev ? { ...prev, dadosBancarios } : prev)}
                    />
                  )}

                  {/* DOCUMENTOS */}
                  {classeAtiva === 'menuDocumentos' && prestador._id && (
                    <GestaoArquivos
                      entityId={prestador._id}
                      entityName={nomeCompleto}
                    />
                  )}

                  {/* STATUS (apenas admin) */}
                  {classeAtiva === 'menuStatus' && isAdmin && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Altere o status deste prestador.</p>
                      <div className="flex flex-wrap gap-2">
                        {(['ativo', 'suspenso', 'inativo'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            disabled={savingStatus || prestador.status === s}
                            className={`px-4 py-2 rounded text-sm font-semibold transition ${prestador.status === s
                              ? 'bg-indigo-600 text-white cursor-default'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'}`}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
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
function formatDateBR(dateStr?: string) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

const InfoCard: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="bg-gray-50 rounded p-2">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
  </div>
);

export default PrestadorDetalhes;
