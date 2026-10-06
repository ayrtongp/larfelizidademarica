import React from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import SolicitacaoCompras from '@/components/Servicos/SolicitacaoCompras';

export default function SolicitacaoComprasPage() {
  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full w-full">
          <SolicitacaoCompras />
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
}


