import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import { T_Categoria } from '@/types/T_financeiroCategorias';
import S_financeiroCategorias from '@/services/S_financeiroCategorias';
import CategoriaForm from '@/components/financeiro/categorias/CategoriaForm';
import CategoriaTable from '@/components/financeiro/categorias/CategoriaTable';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';

const CategoriasFinanceiras = () => {
  const { hasGroup, loading: loadingPermission } = useHasGroup('financeiro');
  const [categorias, setCategorias] = useState<T_Categoria[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [savingData, setSavingData] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCategoria, setEditingCategoria] = useState<T_Categoria | undefined>(undefined);
  const [erroSalvar, setErroSalvar] = useState<string>('');
  const [mesclando, setMesclando] = useState<T_Categoria | null>(null);
  const [destinoId, setDestinoId] = useState<string>('');
  const [salvandoMesclar, setSalvandoMesclar] = useState<boolean>(false);
  const [erroMesclar, setErroMesclar] = useState<string>('');
  const [excluindo, setExcluindo] = useState<T_Categoria | null>(null);
  const [salvandoExcluir, setSalvandoExcluir] = useState<boolean>(false);
  const [erroExcluir, setErroExcluir] = useState<string>('');

  const loadCategorias = async () => {
    try {
      setLoadingData(true);
      const data = await S_financeiroCategorias.getAll();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (hasGroup) {
      loadCategorias();
    }
  }, [hasGroup]);

  const handleOpenNew = () => {
    setEditingCategoria(undefined);
    setErroSalvar('');
    setShowForm(true);
  };

  const handleEdit = (cat: T_Categoria) => {
    setEditingCategoria(cat);
    setErroSalvar('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategoria(undefined);
    setErroSalvar('');
  };

  const handleSave = async (data: T_Categoria) => {
    try {
      setSavingData(true);
      setErroSalvar('');
      if (editingCategoria?._id) {
        await S_financeiroCategorias.update(editingCategoria._id, data);
      } else {
        await S_financeiroCategorias.createNew(data);
      }
      handleCloseForm();
      await loadCategorias();
    } catch (error: any) {
      setErroSalvar(error.message || 'Erro ao salvar categoria.');
    } finally {
      setSavingData(false);
    }
  };

  const handleToggleAtivo = async (id: string) => {
    try {
      await S_financeiroCategorias.toggleAtivo(id);
      await loadCategorias();
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error);
    }
  };

  const handleAbrirMesclar = (cat: T_Categoria) => {
    setMesclando(cat);
    setDestinoId('');
    setErroMesclar('');
  };

  const handleFecharMesclar = () => {
    setMesclando(null);
    setDestinoId('');
    setErroMesclar('');
  };

  const handleConfirmarExcluir = async () => {
    if (!excluindo?._id) return;
    try {
      setSalvandoExcluir(true);
      setErroExcluir('');
      await S_financeiroCategorias.excluir(excluindo._id);
      setExcluindo(null);
      await loadCategorias();
    } catch (error: any) {
      setErroExcluir(error.message || 'Erro ao excluir categoria.');
    } finally {
      setSalvandoExcluir(false);
    }
  };

  const handleConfirmarMesclar = async () => {
    if (!mesclando?._id || !destinoId) return;
    try {
      setSalvandoMesclar(true);
      setErroMesclar('');
      const result = await S_financeiroCategorias.mesclar(mesclando._id, destinoId);
      handleFecharMesclar();
      await loadCategorias();
      alert(`Mesclagem concluída: ${result.movimentacoesAtualizadas} movimentação(ões) e ${result.rateiosAtualizados} rateio(s) atualizados.`);
    } catch (error: any) {
      setErroMesclar(error.message || 'Erro ao mesclar categorias.');
    } finally {
      setSalvandoMesclar(false);
    }
  };

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Categorias Financeiras</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie as categorias de receitas e despesas</p>
            </div>
            {hasGroup && !loadingPermission && (
              <Button_M3
                label="+ Nova Categoria"
                onClick={handleOpenNew}
                type="button"
              />
            )}
          </div>

          {loadingPermission ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500 text-sm">Verificando permissões...</p>
            </div>
          ) : !hasGroup ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-700">Sem permissão</p>
                <p className="text-sm text-gray-500 mt-2">
                  Você não tem acesso ao módulo financeiro. Contate um administrador.
                </p>
              </div>
            </div>
          ) : loadingData ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500 text-sm">Carregando categorias...</p>
            </div>
          ) : (
            <CategoriaTable
              categorias={categorias}
              onEdit={handleEdit}
              onToggleAtivo={handleToggleAtivo}
              onMesclar={handleAbrirMesclar}
              onExcluir={(cat) => { setExcluindo(cat); setErroExcluir(''); }}
            />
          )}
        </div>

        <ModalPadrao isOpen={showForm} onClose={handleCloseForm}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          {erroSalvar && (
            <div className="mb-4 px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              {erroSalvar}
            </div>
          )}
          <CategoriaForm
            onSave={handleSave}
            initialData={editingCategoria}
            loading={savingData}
            categorias={categorias}
          />
        </ModalPadrao>

        <ModalPadrao isOpen={!!excluindo} onClose={() => { setExcluindo(null); setErroExcluir(''); }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Excluir Categoria</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tem certeza que deseja excluir permanentemente a categoria{' '}
            <span className="font-semibold">{excluindo?.nome}</span>?
            Esta ação não pode ser desfeita.
          </p>
          {erroExcluir && (
            <div className="mb-4 px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              {erroExcluir}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button_M3 label="Cancelar" onClick={() => { setExcluindo(null); setErroExcluir(''); }} type="button" bgColor="gray" />
            <Button_M3
              label={salvandoExcluir ? 'Excluindo...' : 'Excluir definitivamente'}
              onClick={handleConfirmarExcluir}
              type="button"
              bgColor="red"
              disabled={salvandoExcluir}
            />
          </div>
        </ModalPadrao>

        <ModalPadrao isOpen={!!mesclando} onClose={handleFecharMesclar}>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Mesclar Categoria</h2>
          <p className="text-sm text-gray-500 mb-4">
            Todas as movimentações e rateios da categoria de origem serão migrados para o destino. A origem será desativada.
          </p>

          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            <span className="font-medium">Origem:</span> {mesclando?.nome}{' '}
            <span className="text-amber-600">({mesclando?.tipo})</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria destino</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={destinoId}
              onChange={(e) => setDestinoId(e.target.value)}
            >
              <option value="">Selecione o destino...</option>
              {categorias
                .filter((c) => c._id !== mesclando?._id && c.tipo === mesclando?.tipo && c.ativo)
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}</option>
                ))}
            </select>
          </div>

          {erroMesclar && (
            <div className="mb-4 px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              {erroMesclar}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button_M3 label="Cancelar" onClick={handleFecharMesclar} type="button" bgColor="gray" />
            <Button_M3
              label={salvandoMesclar ? 'Mesclando...' : 'Confirmar Mesclagem'}
              onClick={handleConfirmarMesclar}
              type="button"
              bgColor="red"
              disabled={!destinoId || salvandoMesclar}
            />
          </div>
        </ModalPadrao>
      </PortalBase>
    </PermissionWrapper>
  );
};

export default CategoriasFinanceiras;
