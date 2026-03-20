import React, { useEffect, useState, useCallback } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import Button_M3 from '@/components/Formularios/Button_M3';
import EmprestimosTable from '@/components/financeiro/emprestimos/EmprestimosTable';
import EmprestimoForm from '@/components/financeiro/emprestimos/EmprestimoForm';
import DevolucaoEmprestimoModal from '@/components/financeiro/emprestimos/DevolucaoEmprestimoModal';
import { S_financeiroEmprestimos } from '@/services/S_financeiroEmprestimos';
import { T_Emprestimo } from '@/types/T_financeiroEmprestimos';

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<T_Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [emprestimoParaDevolver, setEmprestimoParaDevolver] = useState<T_Emprestimo | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: any = {};
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroStatus) filtros.status = filtroStatus;
      const data = await S_financeiroEmprestimos.getAll(filtros);
      setEmprestimos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSave = async (data: any) => {
    await S_financeiroEmprestimos.create(data);
    setShowForm(false);
    carregar();
  };

  const handleDevolver = async (data: any) => {
    if (!emprestimoParaDevolver?._id) return;
    await S_financeiroEmprestimos.devolver(emprestimoParaDevolver._id, data);
    setEmprestimoParaDevolver(null);
    carregar();
  };

  const handleCancelar = async (id: string) => {
    await S_financeiroEmprestimos.cancelar(id);
    carregar();
  };

  return (
    <PortalBase>
      <div className="col-span-full w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Empréstimos e Adiantamentos</h1>
            <p className="text-sm text-gray-500 mt-1">Controle de empréstimos concedidos e recebidos</p>
          </div>
          <Button_M3 label="Novo Empréstimo" onClick={() => setShowForm(true)} type="button" />
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
              <option value="concedido">Concedido</option>
              <option value="recebido">Recebido</option>
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
              <option value="aberto">Aberto</option>
              <option value="parcial">Parcial</option>
              <option value="quitado">Quitado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <EmprestimosTable
            emprestimos={emprestimos}
            onDevolver={setEmprestimoParaDevolver}
            onCancelar={handleCancelar}
          />
        )}

        {/* Modal Formulário */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Empréstimo</h2>
                <EmprestimoForm onSave={handleSave} onCancel={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Modal Devolução */}
        {emprestimoParaDevolver && (
          <DevolucaoEmprestimoModal
            emprestimo={emprestimoParaDevolver}
            onSave={handleDevolver}
            onClose={() => setEmprestimoParaDevolver(null)}
          />
        )}
      </div>
    </PortalBase>
  );
}
