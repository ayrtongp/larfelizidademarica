import React, { useEffect, useState, useCallback } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import Button_M3 from '@/components/Formularios/Button_M3';
import ParcelamentosTable from '@/components/financeiro/parcelamentos/ParcelamentosTable';
import ParcelamentoForm from '@/components/financeiro/parcelamentos/ParcelamentoForm';
import AddParcelaModal from '@/components/financeiro/parcelamentos/AddParcelaModal';
import DetalheParcelamentoModal from '@/components/financeiro/parcelamentos/DetalheParcelamentoModal';
import EditParcelamentoModal from '@/components/financeiro/parcelamentos/EditParcelamentoModal';
import S_financeiroParcelamentos from '@/services/S_financeiroParcelamentos';
import { T_Parcelamento } from '@/types/T_financeiroParcelamentos';

export default function ParcelamentosPage() {
  const [parcelamentos, setParcelamentos] = useState<T_Parcelamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detalhe, setDetalhe] = useState<T_Parcelamento | null>(null);
  const [editando, setEditando] = useState<T_Parcelamento | null>(null);
  const [parcelamentoAddParcela, setParcelamentoAddParcela] = useState<T_Parcelamento | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('ativo');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: any = {};
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroStatus) filtros.status = filtroStatus;
      const data = await S_financeiroParcelamentos.getAll(filtros);
      setParcelamentos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSave = async (data: any) => {
    await S_financeiroParcelamentos.create(data);
    setShowForm(false);
    carregar();
  };

  const handleAddParcela = async (data: any) => {
    if (!parcelamentoAddParcela?._id) return;
    await S_financeiroParcelamentos.addParcela(parcelamentoAddParcela._id, data);
    setParcelamentoAddParcela(null);
    carregar();
  };

  const handleEditar = async (data: any) => {
    if (!editando?._id) return;
    await S_financeiroParcelamentos.update(editando._id, data);
    setEditando(null);
    carregar();
  };

  const handleCancelar = async (id: string) => {
    await S_financeiroParcelamentos.cancelar(id);
    carregar();
  };

  return (
    <PortalBase>
      <div className="col-span-full w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Parcelamentos e Financiamentos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Controle de compras parceladas, financiamentos e acordos tributários
            </p>
          </div>
          <Button_M3 label="Novo Parcelamento" onClick={() => setShowForm(true)} type="button" />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="shadow border rounded py-2 px-3 text-gray-700 text-sm focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="pagar">A Pagar</option>
              <option value="receber">A Receber</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="shadow border rounded py-2 px-3 text-gray-700 text-sm focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="quitado">Quitado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <ParcelamentosTable
            parcelamentos={parcelamentos}
            onVerDetalhes={setDetalhe}
            onAddParcela={setParcelamentoAddParcela}
            onEditar={setEditando}
            onCancelar={handleCancelar}
          />
        )}

        {/* Modal: Novo Parcelamento */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Parcelamento</h2>
                <ParcelamentoForm onSave={handleSave} onCancel={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Modal: Adicionar Parcela */}
        {parcelamentoAddParcela && (
          <AddParcelaModal
            parcelamento={parcelamentoAddParcela}
            onSave={handleAddParcela}
            onClose={() => setParcelamentoAddParcela(null)}
          />
        )}

        {/* Modal: Editar */}
        {editando && (
          <EditParcelamentoModal
            parcelamento={editando}
            onSave={handleEditar}
            onClose={() => setEditando(null)}
          />
        )}

        {/* Modal: Detalhe */}
        {detalhe && (
          <DetalheParcelamentoModal
            parcelamento={detalhe}
            onClose={() => setDetalhe(null)}
          />
        )}
      </div>
    </PortalBase>
  );
}
