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
  { value: 'inativo', label: 'Inativos' },
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

  const [filtroStatus, setFiltroStatus] = useState('ativo');
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
    .filter((i) => i.status !== 'inativo')
    .map((i) => i.usuarioId)
    .filter((id): id is string => !!id);

  const handleSuccess = (novoId: string) => {
    setShowModal(false);
    router.push(`/portal/administrativo/idosos/${novoId}`);
  };

  return (
    <PermissionWrapper href="/portal" groups={['coordenacao']}>
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
              {/* Cards de status */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                {[
                  { value: '',         label: 'Total',     count: idosos.length,                                          bg: 'bg-indigo-50  border-indigo-200  text-indigo-700'  },
                  { value: 'ativo',    label: 'Ativos',    count: idosos.filter((i) => i.status === 'ativo').length,    bg: 'bg-green-50   border-green-200   text-green-700'   },
                  { value: 'afastado', label: 'Afastados', count: idosos.filter((i) => i.status === 'afastado').length, bg: 'bg-yellow-50  border-yellow-200  text-yellow-700'  },
                  { value: 'inativo',  label: 'Inativos',  count: idosos.filter((i) => i.status === 'inativo').length,  bg: 'bg-blue-50    border-blue-200    text-blue-700'    },
                  { value: 'falecido', label: 'Falecidos', count: idosos.filter((i) => i.status === 'falecido').length, bg: 'bg-gray-100   border-gray-300    text-gray-600'    },
                ].map((card) => (
                  <button
                    key={card.value}
                    onClick={() => setFiltroStatus(card.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${card.bg} ${filtroStatus === card.value ? 'ring-2 ring-offset-1 ring-current' : 'hover:opacity-75'}`}
                  >
                    <p className="text-2xl font-bold leading-none">{card.count}</p>
                    <p className="text-xs font-medium mt-1">{card.label}</p>
                  </button>
                ))}
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 mb-4">
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
