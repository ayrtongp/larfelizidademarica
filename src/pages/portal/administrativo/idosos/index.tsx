import React, { useEffect, useMemo, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import { T_IdosoDetalhesComUsuario } from '@/types/T_idosoDetalhes';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import IdosoTable from '@/components/idosos/IdosoTable';
import IdosoAdmissaoModal from '@/components/idosos/IdosoAdmissaoModal';
import Button_M3 from '@/components/Formularios/Button_M3';
import { useRouter } from 'next/router';

const STATUS_FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'alta', label: 'Alta' },
  { value: 'afastado', label: 'Afastados' },
  { value: 'falecido', label: 'Falecidos' },
];

const MODALIDADES = [
  { value: '', label: 'Todas as modalidades' },
  { value: 'residencia_fixa',       label: 'Residência Fixa' },
  { value: 'residencia_temporaria', label: 'Residência Temp.' },
  { value: 'centro_dia',            label: 'Centro Dia' },
  { value: 'hotelaria',             label: 'Hotelaria' },
];

const IdososPage = () => {
  const { hasGroup, loading: loadingPermission } = useHasGroup('coordenacao');
  const router = useRouter();

  const [idosos, setIdosos] = useState<T_IdosoDetalhesComUsuario[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  const loadIdosos = async () => {
    try {
      setLoadingData(true);
      const data = await S_idosoDetalhes.getAll();
      setIdosos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar idosos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (hasGroup) loadIdosos();
  }, [hasGroup]);

  const idososFiltrados = useMemo(() => {
    return idosos.filter((i) => {
      if (filtroStatus && i.status !== filtroStatus) return false;
      if (filtroModalidade && i.admissao?.modalidadePrincipal !== filtroModalidade) return false;
      if (filtroBusca) {
        const nome = `${i.usuario?.nome ?? ''} ${i.usuario?.sobrenome ?? ''}`.toLowerCase();
        if (!nome.includes(filtroBusca.toLowerCase())) return false;
      }
      return true;
    });
  }, [idosos, filtroStatus, filtroModalidade, filtroBusca]);

  const usuariosJaVinculados = idosos
    .filter((i) => i.status !== 'alta')
    .map((i) => i.usuarioId);

  const handleSuccess = (novoId: string) => {
    setShowModal(false);
    router.push(`/portal/administrativo/idosos/${novoId}`);
  };

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full">

          {/* Header */}
          <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Idosos</h1>
              <p className="text-sm text-gray-500 mt-1">
                {loadingData ? 'Carregando...' : `${idososFiltrados.length} idoso(s) encontrado(s)`}
              </p>
            </div>
            {hasGroup && !loadingPermission && (
              <Button_M3 label="+ Admitir Idoso" onClick={() => setShowModal(true)} type="button" />
            )}
          </div>

          {loadingPermission ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500 text-sm">Verificando permissões...</p>
            </div>
          ) : !hasGroup ? (
            <div className="flex items-center justify-center py-20 text-center">
              <div>
                <p className="text-xl font-semibold text-gray-700">Sem permissão</p>
                <p className="text-sm text-gray-500 mt-2">Você não tem acesso ao módulo de Coordenação. Contate um administrador.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex gap-1 flex-wrap">
                  {STATUS_FILTROS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setFiltroStatus(s.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroStatus === s.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                />

                <select
                  value={filtroModalidade}
                  onChange={(e) => setFiltroModalidade(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-gray-500 text-sm">Carregando idosos...</p>
                </div>
              ) : (
                <IdosoTable idosos={idososFiltrados} />
              )}
            </>
          )}
        </div>

        <IdosoAdmissaoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          usuariosJaVinculados={usuariosJaVinculados}
        />
      </PortalBase>
    </PermissionWrapper>
  );
};

export default IdososPage;
