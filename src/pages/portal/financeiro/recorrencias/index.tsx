import React, { useEffect, useState, useCallback } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import Button_M3 from '@/components/Formularios/Button_M3';
import RecorrenciasTable from '@/components/financeiro/recorrencias/RecorrenciasTable';
import RecorrenciaForm from '@/components/financeiro/recorrencias/RecorrenciaForm';
import { S_financeiroRecorrencias } from '@/services/S_financeiroRecorrencias';
import { T_Recorrencia } from '@/types/T_financeiroRecorrencias';

export default function RecorrenciasPage() {
  const [recorrencias, setRecorrencias] = useState<T_Recorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<T_Recorrencia | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await S_financeiroRecorrencias.getAll();
      setRecorrencias(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSave = async (data: Partial<T_Recorrencia>) => {
    if (editando?._id) {
      await S_financeiroRecorrencias.update(editando._id, data);
    } else {
      await S_financeiroRecorrencias.create(data);
    }
    setShowForm(false);
    setEditando(null);
    carregar();
  };

  const handleEditar = (recorrencia: T_Recorrencia) => {
    setEditando(recorrencia);
    setShowForm(true);
  };

  const handleToggleAtivo = async (id: string) => {
    await S_financeiroRecorrencias.toggleAtivo(id);
    carregar();
  };

  const handleExcluir = async (id: string) => {
    await S_financeiroRecorrencias.delete(id);
    carregar();
  };

  const handleFecharModal = () => {
    setShowForm(false);
    setEditando(null);
  };

  return (
    <PortalBase>
      <div className="col-span-full w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Recorrências</h1>
            <p className="text-sm text-gray-500 mt-1">Regras de lançamentos automáticos mensais</p>
          </div>
          <Button_M3 label="Nova Recorrência" onClick={() => setShowForm(true)} type="button" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <RecorrenciasTable
            recorrencias={recorrencias}
            onEditar={handleEditar}
            onToggleAtivo={handleToggleAtivo}
            onExcluir={handleExcluir}
          />
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {editando ? 'Editar Recorrência' : 'Nova Recorrência'}
                </h2>
                <RecorrenciaForm
                  recorrencia={editando}
                  onSave={handleSave}
                  onCancel={handleFecharModal}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalBase>
  );
}
