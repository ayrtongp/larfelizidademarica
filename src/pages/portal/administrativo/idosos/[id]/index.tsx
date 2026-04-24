import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import AvatarCropper from '@/components/AvatarCropper';
import { getUserID } from '@/utils/Login';
import { T_IdosoDetalhesComUsuario } from '@/types/T_idosoDetalhes';
import Tab_Admissao from '@/components/idosos/tabs/Tab_Admissao';
import Tab_Familia from '@/components/idosos/tabs/Tab_Familia';
import Tab_Historico from '@/components/idosos/tabs/Tab_Historico';
import Tab_Contratos from '@/components/idosos/tabs/Tab_Contratos';
import Tab_Clinico from '@/components/idosos/tabs/Tab_Clinico';
import ClinicalSummary from '@/components/idosos/ClinicalSummary';
import GestaoArquivos from '@/components/Arquivos/GestaoArquivos';
import Prescricao from '@/components/Residentes/Prescricao';
import { notifyError, notifySuccess } from '@/utils/Functions';
import {
  FaUser, FaFileContract, FaUsers, FaBook, FaFolder, FaSignOutAlt, FaPills, FaHeartbeat,
} from 'react-icons/fa';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativo:    { label: 'Ativo',    className: 'bg-green-100 text-green-800' },
  inativo:  { label: 'Inativo',  className: 'bg-blue-100 text-blue-800' },
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

  const tabs: MenuTab[] = [
    { id: 'menuVisaoGeral',   label: 'Visão Geral',   icon: <FaUser />,         color: 'text-blue-600' },
    { id: 'menuAdmissao',     label: 'Admissão',       icon: <FaBook />,         color: 'text-indigo-600' },
    { id: 'menuFamilia',      label: 'Família',         icon: <FaUsers />,        color: 'text-green-600' },
    { id: 'menuHistorico',    label: 'Histórico',       icon: <FaBook />,         color: 'text-gray-600' },
    { id: 'menuContratos',    label: 'Contratos',       icon: <FaFileContract />, color: 'text-yellow-600' },
    { id: 'menuPrescricoes',  label: 'Prescrições',     icon: <FaPills />,        color: 'text-purple-600' },
    { id: 'menuClinico',     label: 'Clínico',          icon: <FaHeartbeat />,    color: 'text-red-500' },
    { id: 'menuDocumentos',   label: 'Documentos',      icon: <FaFolder />,       color: 'text-fuchsia-600' },
    ...(isAdmin ? [{ id: 'menuStatus', label: 'Status', icon: <FaSignOutAlt />, color: 'text-red-600' }] : []),
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

  const handleFotoUpload = async (blobOrBase64: string) => {
    const patientId = idoso?.patient_id;
    if (!patientId) return;
    try {
      const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';
      const blob = await fetch(blobOrBase64).then((r) => r.blob());
      const form = new FormData();
      form.append('file', blob, 'foto_perfil.jpg');
      form.append('originalName', 'foto_perfil.jpg');
      form.append('collection', 'foto_perfil');
      form.append('resource', 'perfil');
      form.append('userId', patientId);
      form.append('folder', patientId);
      form.append('createdBy', getUserID());
      form.append('isPublic', 'true');

      const uploadRes = await fetch(`${EXPRESS_URL}/r2_upload`, { method: 'POST', body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.ok) { notifyError(uploadData.error || 'Erro ao enviar foto.'); return; }

      const photoUrl: string = uploadData.file?.url;
      await fetch(`/api/Controller/patient.controller?type=updatePhoto&id=${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: photoUrl }),
      });

      setIdoso((prev) => prev ? {
        ...prev,
        usuario: prev.usuario ? { ...prev.usuario, foto_cdn: photoUrl, foto_base64: undefined } : prev.usuario,
      } : prev);
      notifySuccess('Foto atualizada!');
    } catch {
      notifyError('Erro ao atualizar foto.');
    }
  };

  const handleStatusChange = async (novoStatus: 'ativo' | 'inativo' | 'falecido' | 'afastado', dataSaida?: string) => {
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
            <div className="space-y-4">

              {/* ── PERFIL HEADER ────────────────────────────────────────── */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">

                {/* Avatar + Info */}
                <div className="px-5 sm:px-8 pb-0">
                  <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-5 py-5">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {isAdmin ? (
                        <AvatarCropper
                          returnType="blob"
                          defaultImage={foto || undefined}
                          onImageCropped={handleFotoUpload}
                          size={20}
                        />
                      ) : foto ? (
                        <Image src={foto} width={80} height={80} alt={nomeCompleto} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-2xl font-bold border-4 border-white shadow-md">
                          {nomeCompleto.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Nome + meta */}
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{nomeCompleto}</h1>
                        {statusInfo && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {idoso.usuario?.apelido && (
                          <span>"{idoso.usuario.apelido}" · </span>
                        )}
                        {idoso.usuario?.data_nascimento ? (
                          <>
                            {formatDateBR(idoso.usuario.data_nascimento)}
                            <span className="text-gray-400"> ({calcIdade(idoso.usuario.data_nascimento)} anos)</span>
                          </>
                        ) : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tab bar horizontal */}
                <div className="border-t border-gray-100 mt-1">
                  <div className="flex flex-wrap px-4 sm:px-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setClasseAtiva(tab.id)}
                        title={tab.label}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                          classeAtiva === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                        }`}
                      >
                        <span className={`text-sm sm:text-xs ${classeAtiva === tab.id ? 'text-indigo-600' : tab.color}`}>
                          {tab.icon}
                        </span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CONTEÚDO DA ABA ──────────────────────────────────────── */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-5 sm:p-6">

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
                      {idoso.patient_id && (
                        <ClinicalSummary
                          patientId={idoso.patient_id}
                          onNavigate={() => setClasseAtiva('menuClinico')}
                        />
                      )}

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
                      usuarioId={idoso.usuarioId ?? ''}
                    />
                  )}

                  {/* PRESCRIÇÕES */}
                  {classeAtiva === 'menuPrescricoes' && idoso._id && (
                    <Prescricao idosoData={{ _id: idoso._id, nome: nomeCompleto }} />
                  )}

                  {/* CLÍNICO */}
                  {classeAtiva === 'menuClinico' && (
                    <Tab_Clinico patientId={idoso.patient_id ?? ''} />
                  )}

                  {/* DOCUMENTOS */}
                  {classeAtiva === 'menuDocumentos' && idoso._id && (
                    <GestaoArquivos
                      entityId={idoso._id}
                      entityName={nomeCompleto}
                    />
                  )}

                  {/* STATUS (apenas admin) */}
                  {classeAtiva === 'menuStatus' && isAdmin && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 font-medium">Altere o status deste idoso.</p>
                        <p className="text-xs text-gray-400">
                          <strong>Afastado</strong>: ausência temporária (hospital, família).{' '}
                          <strong>Inativo</strong>: desvinculado do lar (sem ser por falecimento).
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['ativo', 'afastado', 'inativo', 'falecido'] as const).map((s) => (
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

function calcIdade(dateStr?: string): number {
  if (!dateStr) return 0;
  const hoje = new Date();
  const nasc = new Date(dateStr);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

const InfoCard: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="bg-gray-50 rounded p-2">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
  </div>
);

export default IdosoDetalhes;
