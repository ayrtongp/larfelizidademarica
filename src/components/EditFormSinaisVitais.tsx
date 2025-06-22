import { useEffect, useState } from "react";
import { formatDateBR, notifySuccess, getID } from "@/utils/Functions";
import { useRouter } from "next/router";
import GridSinaisVitais from "./GridSinaisVitais";

interface Sinal {
  _id: string, idoso: string; idoso_id: string; data: string; datalancamento: string; consciencia: string;
  hemodinamico: string; cardiovascular: string; pressaoarterial: string; respiratorio: string;
  mucosas: string; integridadecutanea: string; mmss: string; mmii: string; aceitacaodadieta: string;
  abdomen: string; eliminacoes: string; eliminacoesintestinais: string; auscultapulmonar: string; observacoes: string;
  id_usuario_cadastro: string; nome_usuario: string; registro_usuario: string; funcao_usuario: string; createdAt: string;
}

const FormSinaisVitais = () => {
  const router = useRouter();
  const [sinal, setSinal] = useState<Sinal>();

  useEffect(() => {
    const { editId } = router.query as { [key: string]: string };
    if (editId) {
      getID(editId).then((res) => { setSinal(res) })
    }
  }, [router.query]);

  if (!sinal) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="text-center mx-auto">
      <div className="flex items-center justify-center flex-col">
        <div className="mt-4 mb-4 border rounded p-2 flex flex-col">
          <div className="flex flex-row">
            <h1 className="mx-2 font-bold">Idoso:</h1><span>{sinal.idoso}</span>
          </div>
          <div className="flex flex-row">
            <h1 className="mx-2 font-bold">Data:</h1><span>{formatDateBR(sinal.data)}</span>
          </div>
        </div>
        <div className="text-center p-1 mx-auto">
          <GridSinaisVitais sinalData={sinal} />
        </div>
      </div>
    </div >
  )
}

export default FormSinaisVitais;