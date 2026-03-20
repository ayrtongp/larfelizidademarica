import React, { useEffect, useState } from 'react';
import { T_ContratoIdoso } from '@/types/T_contratosIdoso';
import S_contratosIdoso from '@/services/S_contratosIdoso';
import ContratoCard from '../ContratoCard';
import ContratoIdosoModal from '../ContratoIdosoModal';
import Button_M3 from '@/components/Formularios/Button_M3';

interface Props {
  idosoDetalhesId: string;
  usuarioId: string;
}

const Tab_Contratos: React.FC<Props> = ({ idosoDetalhesId, usuarioId }) => {
  const [contratos, setContratos] = useState<T_ContratoIdoso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadContratos = async () => {
    try {
      setLoading(true);
      const data = await S_contratosIdoso.getByIdosoId(idosoDetalhesId);
      setContratos(Array.isArray(data) ? data : []);
    } catch {
      setContratos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContratos();
  }, [idosoDetalhesId]);

  const handleContratoUpdate = (updated: T_ContratoIdoso) => {
    setContratos((prev) => prev.map((c) => c._id === updated._id ? updated : c));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Contratos vinculados a este idoso.</p>
        <Button_M3 label="+ Novo Contrato" onClick={() => setShowModal(true)} type="button" />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-6 text-center">Carregando contratos...</p>
      ) : contratos.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">Nenhum contrato cadastrado.</p>
          <p className="text-xs mt-1">Clique em "+ Novo Contrato" para adicionar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contratos.map((c) => (
            <ContratoCard key={c._id} contrato={c} onUpdate={handleContratoUpdate} />
          ))}
        </div>
      )}

      <ContratoIdosoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadContratos}
        usuarioId={usuarioId}
        idosoDetalhesId={idosoDetalhesId}
      />
    </div>
  );
};

export default Tab_Contratos;
