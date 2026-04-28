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
      </PortalBase>
    </PermissionWrapper>
  );
};

export default CategoriasFinanceiras;
