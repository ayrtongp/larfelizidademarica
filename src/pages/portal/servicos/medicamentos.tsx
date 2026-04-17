import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import CalendarioAdministracao from '@/components/medicamentos/CalendarioAdministracao';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function MedicamentosPage() {
    const { hasGroup, loading } = useHasGroup('coordenacao');
    const isAdmin = useIsAdmin();

    return (
        <PermissionWrapper href="/portal">
            <PortalBase>
                <div className="col-span-full">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <p className="text-gray-400 text-sm">Verificando permissões...</p>
                        </div>
                    ) : !hasGroup && !isAdmin ? (
                        <div className="flex justify-center py-20 text-center">
                            <div>
                                <p className="text-xl font-semibold text-gray-700">Sem permissão</p>
                                <p className="text-sm text-gray-500 mt-2">Você não tem acesso ao módulo de Coordenação.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 max-w-5xl mx-auto">
                            <div className="mb-4">
                                <h1 className="text-2xl font-bold text-slate-800">Administração de Medicamentos</h1>
                                <p className="text-sm text-gray-500 mt-1">Registre a administração de medicamentos prescritos para os idosos.</p>
                            </div>
                            <CalendarioAdministracao />
                        </div>
                    )}
                </div>
            </PortalBase>
        </PermissionWrapper>
    );
}
