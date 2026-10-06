import React from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import GestaoArquivosEmpresa from '@/components/Arquivos/GestaoArquivosEmpresa';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';

export default function ArquivosEmpresaPage() {
  return (
    <PermissionWrapper href="/portal" groups={[ADMINISTRATIVO_GROUP_ID]}>
      <PortalBase>
        <div className="col-span-full"><GestaoArquivosEmpresa /></div>
      </PortalBase>
    </PermissionWrapper>
  );
}

