import React from 'react';
import GestaoArquivos from '@/components/Arquivos/GestaoArquivos';

interface Props {
  prestadorId: string;
  nomeCompleto: string;
}

const Tab_Documentos: React.FC<Props> = ({ prestadorId, nomeCompleto }) => {
  return <GestaoArquivos entityId={prestadorId} entityName={nomeCompleto} />;
};

export default Tab_Documentos;
