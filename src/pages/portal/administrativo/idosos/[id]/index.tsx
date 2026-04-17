import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import { T_IdosoDetalhesComUsuario } from '@/types/T_idosoDetalhes';
import Tab_Admissao from '@/components/idosos/tabs/Tab_Admissao';
import Tab_Familia from '@/components/idosos/tabs/Tab_Familia';
import Tab_Historico from '@/components/idosos/tabs/Tab_Historico';
import Tab_Contratos from '@/components/idosos/tabs/Tab_Contratos';
import GestaoArquivos from '@/components/Arquivos/GestaoArquivos';
import Prescricao from '@/components/Residentes/Prescricao';
import { notifyError, notifySuccess } from '@/utils/Functions';
import {
  FaUser, FaFileContract, FaUsers, FaBook, FaFolder, FaSignOutAlt, FaPills,
} from 'react-icons/fa';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativo:    { label: 'Ativo',    className: 'bg-green-100 text-green-800' },
  alta:     { label: 'Alta',     className: 'bg-blue-100 text-blue-800' },
  falecido: { label: 'Falecido', className: 'bg-gray-200 text-gray-700' },
  afastado: { label: 'Afastado', className: 'bg-yellow-100 text-yellow-800' },
};

const MODALIDADE_LABELS: Record<string, string> = {
  residencia_fixa:       'Residência Fixa',
  residencia_temporaria: 'Residência Temporária',
  centro_dia:            'Centro Dia',
  hotelaria:             'Hotelaria',
};

interface MenuTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const IdosoDetalhes = () => {
  const router = useRouter();
  const { id } = router.query;
  const { hasGroup, loading: loadingPermission } = useHasGroup('coordenacao');
  const isAdmin = useIsAdmin();

  const [idoso, setIdoso] = useState<T_IdosoDetalhesComUsuario | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [classeAtiva, setClasseAtiva] = useState('menuVisaoGeral');
  const [savingStatus, setSavingStatus] = useState(false);

  const efeitoClasseAtiva = 'bg-slate-100 border-l-2 border-purple-500';

  const tabs: MenuTab[] = [
    { id: 'menuVisaoGeral',   label: 'Visão Geral',   icon: <FaUser />,         color: 'text-blue-600' },
    { id: 'menuAdmissao',     label: 'Admissão',       icon: <FaBook />,         color: 'text-indigo-600' },
    { id: 'menuFamilia',      label: 'Família',         icon: <FaUsers />,        color: 'text-green-600' },
    { id: 'menuHistorico',    label: 'Histórico',       icon: <FaBook />,         color: 'text-gray-600' },
    { id: 'menuContratos',    label: 'Contratos',       icon: <FaFileContract />, color: 'text-yellow-600' },
    { id: 'menuPrescricoes',  label: 'Prescrições',     icon: <FaPills />,        color: 'text-purple-600' },
    { id: 'menuDocumentos',   label: 'Documentos',      icon: <FaFolder />,       color: 'text-fuchsia-600' },
    ...(isAdmin ? [{ id: 'menuStatus', label: 'Status / Alta', icon: <FaSignOutAlt />, color: 'text-red-600' }] : []),
  ];

  const loadIdoso = async (idosoId: string) => {
    try {
      setLoadingData(true);
      const data = await S_idosoDetalhes.getById(idosoId);
      setIdoso(data);
    } catch (error) {
      console.error('Erro ao carregar idoso:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (id && typeof id === 'string' && hasGroup) {
      loadIdoso(id);
    }
  }, [id, hasGroup]);

  const handleStatusChange = async (novoStatus: 'ativo' | 'alta' | 'falecido' | 'afastado', dataSaida?: string) => {
    if (!idoso?._id) return;
    try {
      setSavingStatus(true);
      await S_idosoDetalhes.updateStatus(idoso._id, { status: novoStatus, dataSaida });
      setIdoso((prev) => prev ? { ...prev, status: novoStatus } : prev);
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
              <p className="text-sm text-gray-500 mt-2">Você não tem acesso ao módulo de Coordenação.</p>
            </div>
          </div>
        </PortalBase>
      </PermissionWrapper>
    );
  }

  const nomeCompleto = idoso?.usuario ? `${idoso.usuario.nome} ${idoso.usuario.sobrenome}` : '—';
  const foto = idoso?.usuario?.foto_cdn || idoso?.usuario?.foto_base64;
  const statusInfo = idoso ? (STATUS_CONFIG[idoso.status] ?? { label: idoso.status, className: 'bg-gray-100 text-gray-700' }) : null;

  return (
    <PermissionWrapper href="/portal/administrativo/idosos">
      <PortalBase>
        <div className="col-span-full">

          {loadingData || !idoso ? (
            <div className="flex justify-center py-20">
              <p className="text-gray-500 text-sm">{loadingData ? 'Carregando...' : 'Idoso não encontrado.'}</p>
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
                      <p className="text-xs text-gray-500 mt-0.5">
                        {MODALIDADE_LABELS[idoso.admissao?.modalidadePrincipal] || '—'}
                      </p>
                      {idoso.admissao?.numProntuario && (
                        <p className="text-xs text-gray-400">Prontuário: {idoso.admissao.numProntuario}</p>
                      )}
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
                        <InfoCard label="Modalidade" value={MODALIDADE_LABELS[idoso.admissao?.modalidadePrincipal]} />
                        <InfoCard label="Data de Entrada" value={formatDateBR(idoso.admissao?.dataEntrada)} />
                        <InfoCard label="Prontuário" value={idoso.admissao?.numProntuario} />
                        <InfoCard label="Responsável" value={idoso.responsavel?.nome} />
                        <InfoCard label="Parentesco" value={idoso.responsavel?.parentesco} />
                        <InfoCard label="Contato" value={idoso.responsavel?.contato} />
                        <InfoCard label="Profissão" value={idoso.historico?.profissao} />
                        <InfoCard label="Estado Civil" value={idoso.historico?.estadoCivil} />
                        <InfoCard label="Religião" value={idoso.historico?.religiao} />
                      </div>
                      {idoso.responsavel?.interditado && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                          <strong>Atenção:</strong> Idoso interditado. Proc. {idoso.responsavel.processoInterdicao || '—'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ADMISSÃO */}
                  {classeAtiva === 'menuAdmissao' && (
                    <Tab_Admissao
                      idosoId={idoso._id!}
                      admissao={idoso.admissao}
                      responsavel={idoso.responsavel ?? {}}
                      onUpdate={(data) => setIdoso((prev) => prev ? { ...prev, ...data } : prev)}
                    />
                  )}

                  {/* FAMÍLIA */}
                  {classeAtiva === 'menuFamilia' && (
                    <Tab_Familia
                      idosoId={idoso._id!}
                      composicaoFamiliar={idoso.composicaoFamiliar ?? []}
                      onUpdate={(composicaoFamiliar) => setIdoso((prev) => prev ? { ...prev, composicaoFamiliar } : prev)}
                    />
                  )}

                  {/* HISTÓRICO */}
                  {classeAtiva === 'menuHistorico' && (
                    <Tab_Historico
                      idosoId={idoso._id!}
                      historico={idoso.historico ?? {}}
                      documentos={idoso.documentos ?? {}}
                      onUpdate={(data) => setIdoso((prev) => prev ? { ...prev, ...data } : prev)}
                    />
                  )}

                  {/* CONTRATOS */}
                  {classeAtiva === 'menuContratos' && idoso._id && (
                    <Tab_Contratos
                      idosoDetalhesId={idoso._id}
                      usuarioId={idoso.usuarioId}
                    />
                  )}

                  {/* PRESCRIÇÕES */}
                  {classeAtiva === 'menuPrescricoes' && idoso._id && (
                    <Prescricao idosoData={{ _id: idoso._id, nome: nomeCompleto }} />
                  )}

                  {/* DOCUMENTOS */}
                  {classeAtiva === 'menuDocumentos' && idoso._id && (
                    <GestaoArquivos
                      entityId={idoso._id}
                      entityName={nomeCompleto}
                    />
                  )}

                  {/* STATUS / ALTA (apenas admin) */}
                  {classeAtiva === 'menuStatus' && isAdmin && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Altere o status deste idoso.</p>
                      <div className="flex flex-wrap gap-2">
                        {(['ativo', 'afastado', 'alta', 'falecido'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            disabled={savingStatus || idoso.status === s}
                            className={`px-4 py-2 rounded text-sm font-semibold transition ${idoso.status === s
                              ? 'bg-indigo-600 text-white cursor-default'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'}`}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                      {idoso.status === 'ativo' && (
                        <p className="text-xs text-gray-400">Para dar alta ao idoso, clique em &quot;Alta&quot; acima.</p>
                      )}
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

export default IdosoDetalhes;
