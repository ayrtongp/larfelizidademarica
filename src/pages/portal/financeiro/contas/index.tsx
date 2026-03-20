import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import { T_ContaFinanceira } from '@/types/T_financeiroContas';
import S_financeiroContas from '@/services/S_financeiroContas';
import ContaFinanceiraForm from '@/components/financeiro/contas/ContaFinanceiraForm';
import ContaFinanceiraTable from '@/components/financeiro/contas/ContaFinanceiraTable';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';

const ContasFinanceiras = () => {
  const { hasGroup, loading: loadingPermission } = useHasGroup('financeiro');
  const [contas, setContas] = useState<T_ContaFinanceira[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [savingData, setSavingData] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingConta, setEditingConta] = useState<T_ContaFinanceira | undefined>(undefined);

  const loadContas = async () => {
    try {
      setLoadingData(true);
      const data = await S_financeiroContas.getAll();
      setContas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (hasGroup) {
      loadContas();
    }
  }, [hasGroup]);

  const handleOpenNew = () => {
    setEditingConta(undefined);
    setShowForm(true);
  };

  const handleEdit = (conta: T_ContaFinanceira) => {
    setEditingConta(conta);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingConta(undefined);
  };

  const handleSave = async (data: T_ContaFinanceira) => {
    try {
      setSavingData(true);
      if (editingConta?._id) {
        await S_financeiroContas.update(editingConta._id, data);
      } else {
        await S_financeiroContas.createNew(data);
      }
      handleCloseForm();
      await loadContas();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    } finally {
      setSavingData(false);
    }
  };

  const handleToggleAtivo = async (id: string) => {
    try {
      await S_financeiroContas.toggleAtivo(id);
      await loadContas();
    } catch (error) {
      console.error('Erro ao alterar status da conta:', error);
    }
  };

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Contas Financeiras</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie as contas bancárias, caixas e aplicações</p>
            </div>
            {hasGroup && !loadingPermission && (
              <Button_M3
                label="+ Nova Conta"
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
              <p className="text-gray-500 text-sm">Carregando contas...</p>
            </div>
          ) : (
            <ContaFinanceiraTable
              contas={contas}
              onEdit={handleEdit}
              onToggleAtivo={handleToggleAtivo}
            />
          )}
        </div>

        <ModalPadrao isOpen={showForm} onClose={handleCloseForm}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingConta ? 'Editar Conta' : 'Nova Conta Financeira'}
          </h2>
          <ContaFinanceiraForm
            onSave={handleSave}
            initialData={editingConta}
            loading={savingData}
          />
        </ModalPadrao>
      </PortalBase>
    </PermissionWrapper>
  );
};

export default ContasFinanceiras;
