import React, { useCallback, useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import { T_TituloFinanceiro, T_BaixaTitulo } from '@/types/T_financeiroTitulos';
import S_financeiroTitulos from '@/services/S_financeiroTitulos';
import TituloTable from '@/components/financeiro/titulos/TituloTable';
import TituloForm from '@/components/financeiro/titulos/TituloForm';
import TituloStatusBadge from '@/components/financeiro/titulos/TituloStatusBadge';
import BaixaTituloModal from '@/components/financeiro/titulos/BaixaTituloModal';
import BaixasListModal from '@/components/financeiro/titulos/BaixasListModal';
import Button_M3 from '@/components/Formularios/Button_M3';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'aberto', label: 'Aberto' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'liquidado', label: 'Liquidado' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function ContasReceberPage() {
  const [titulos, setTitulos] = useState<T_TituloFinanceiro[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingTitulo, setEditingTitulo] = useState<T_TituloFinanceiro | undefined>();

  const [tituloBaixar, setTituloBaixar] = useState<T_TituloFinanceiro | null>(null);
  const [tituloVerBaixas, setTituloVerBaixas] = useState<T_TituloFinanceiro | null>(null);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');

  const fetchTitulos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await S_financeiroTitulos.getAll({ tipo: 'receber' });
      setTitulos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTitulos();
  }, [fetchTitulos]);

  const titulosFiltrados = titulos.filter((t) => {
    const matchStatus = !filtroStatus || t.status === filtroStatus;
    const matchBusca = !busca || t.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  const handleSave = async (data: Partial<T_TituloFinanceiro>) => {
    setSaving(true);
    try {
      if (editingTitulo?._id) {
        await S_financeiroTitulos.update(editingTitulo._id, data);
      } else {
        await S_financeiroTitulos.create({
          ...data,
          tipo: 'receber',
        } as any);
      }
      await fetchTitulos();
      setShowForm(false);
      setEditingTitulo(undefined);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar título.');
    } finally {
      setSaving(false);
    }
  };

  const handleBaixar = async (baixaData: Omit<T_BaixaTitulo, '_id' | 'tituloId' | 'createdAt'>) => {
    if (!tituloBaixar?._id) return;
    setSaving(true);
    try {
      await S_financeiroTitulos.baixar(tituloBaixar._id, baixaData);
      await fetchTitulos();
      setTituloBaixar(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar baixa.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = async (titulo: T_TituloFinanceiro) => {
    if (!titulo._id) return;
    try {
      await S_financeiroTitulos.cancelar(titulo._id);
      await fetchTitulos();
    } catch (err) {
      console.error(err);
      alert('Erro ao cancelar título.');
    }
  };

  const handleEditar = (titulo: T_TituloFinanceiro) => {
    setEditingTitulo(titulo);
    setShowForm(true);
  };

  const handleNovoTitulo = () => {
    setEditingTitulo(undefined);
    setShowForm(true);
  };

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Contas a Receber</h1>
              <p className="text-sm text-gray-500">Gerencie os títulos a receber</p>
            </div>
            <Button_M3
              label="+ Novo Título"
              onClick={handleNovoTitulo}
              bgColor="green"
              type="button"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-4 bg-white p-3 rounded-lg shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar</label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por descrição..."
                className="border rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
              />
            </div>
          </div>

          {/* Form modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingTitulo ? 'Editar Título' : 'Novo Título a Receber'}
                  </h2>
                  <button
                    onClick={() => { setShowForm(false); setEditingTitulo(undefined); }}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-4">
                  <TituloForm
                    tipo="receber"
                    titulo={editingTitulo}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingTitulo(undefined); }}
                    saving={saving}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal de baixa */}
          {tituloBaixar && (
            <BaixaTituloModal
              titulo={tituloBaixar}
              onConfirmar={handleBaixar}
              onFechar={() => setTituloBaixar(null)}
              saving={saving}
            />
          )}

          {/* Modal de histórico de baixas */}
          {tituloVerBaixas && (
            <BaixasListModal
              titulo={tituloVerBaixas}
              onFechar={() => setTituloVerBaixas(null)}
            />
          )}

          {/* Tabela */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : (
            <TituloTable
              titulos={titulosFiltrados}
              onVerBaixas={(t) => setTituloVerBaixas(t)}
              onBaixar={(t) => setTituloBaixar(t)}
              onCancelar={handleCancelar}
              onEditar={handleEditar}
            />
          )}
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
}
