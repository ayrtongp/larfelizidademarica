import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import { formatDateBR } from "@/utils/Functions";
import Navportal from "@/components/Navportal";
import PermissionWrapper from "@/components/PermissionWrapper";
import BotaoPadrao from "@/components/BotaoPadrao";

interface Sinal {
  idoso: string;
  idoso_id: string;
  data: string;
  datalancamento: string;
  consciencia: string;
  hemodinamico: string;
  cardiovascular: string;
  pressaoarterial: string;
  respiratorio: string;
  mucosas: string;
  integridadecutanea: string;
  mmss: string;
  mmii: string;
  aceitacaodadieta: string;
  abdomen: string;
  eliminacoes: string;
  eliminacoesintestinais: string;
  auscultapulmonar: string;
  observacoes: string;
  id_usuario_cadastro: string;
  nome_usuario: string;
  registro_usuario: string;
  funcao_usuario: string;
  createdAt: string;
}

async function getID(id: string) {
  const result = await axios.get(`/api/Controller/SinaisVitaisController?id=${id}`)
  return result.data.sinalVital
}

const Detalhes = () => {
  const router = useRouter();
  const [sinal, setSinal] = useState<Sinal>();

  useEffect(() => {
    const { id } = router.query as { [key: string]: string };
    if (id) {
      getID(id).then((res) => { setSinal(res) })
    }
  }, [router.query]);

  if (!sinal) {
    return <div>Carregando...</div>;
  }

  return (
    <PermissionWrapper href='/portal/sinaisvitais'>
      <div>
        <Navportal />
        <BotaoPadrao href='/portal/sinaisvitais' text='Voltar' />
        <div className="container mx-auto py-4 text-center">
          <div className="hidden">
            <h1>HIDDEN INFORMATION</h1>
            <p className="text-gray-500">ID idoso: {sinal.idoso_id}</p>
            <p className="text-gray-500">Data do Cadastro: {sinal.datalancamento}</p>
            <p className="text-gray-500">ID Usuário Cadastro: {sinal.id_usuario_cadastro}</p>
          </div>
          <div className="my-4">
            <h1 className="text-3xl font-bold">Idoso: {sinal.idoso}</h1>
            <p className="text-gray-500">Data dos Sinais Vitais: {formatDateBR(sinal.data)}</p>
          </div>
          <hr />
          <div className="my-4">
            <h2 className="text-xl font-bold">Informações dos sinais vitais</h2>
            <table className="table-auto mx-auto mt-4 text-center">
              <tbody>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Consciência</td>
                  <td className="py-1 pl-5">{sinal.consciencia}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Hemodinâmico</td>
                  <td className="py-1 pl-5">{sinal.hemodinamico}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Cardiovascular</td>
                  <td className="py-1 pl-5">{sinal.cardiovascular}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Pressão Arterial</td>
                  <td className="py-1 pl-5">{sinal.pressaoarterial}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Respiratório</td>
                  <td className="py-1 pl-5">{sinal.respiratorio}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Mucosas</td>
                  <td className="py-1 pl-5">{sinal.mucosas}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Integridade Cutânea</td>
                  <td className="py-1 pl-5">{sinal.integridadecutanea}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">MMSS</td>
                  <td className="py-1 pl-5">{sinal.mmss}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">MMII</td>
                  <td className="py-1 pl-5">{sinal.mmii}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Aceitação da Dieta</td>
                  <td className="py-1 pl-5">{sinal.aceitacaodadieta}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Abdomen</td>
                  <td className="py-1 pl-5">{sinal.abdomen}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Eliminações</td>
                  <td className="py-1 pl-5">{sinal.eliminacoes}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Eliminações Intestinais</td>
                  <td className="py-1 pl-5">{sinal.eliminacoesintestinais}</td>
                </tr>
                <tr className="text-left">
                  <td className="py-1 font-semibold">Ausculta Pulmonar</td>
                  <td className="py-1 pl-5">{sinal.auscultapulmonar}</td>
                </tr>
              </tbody>
            </table>
            <div className="my-4">
              <h1 className="text-3xl font-bold">Observações</h1>
              <p className="text-gray-500">{sinal.observacoes}</p>
            </div>
            <div className="my-4">
              <h1 className="text-3xl font-bold">Responsável pela Elaboração</h1>
              <p className="text-gray-500">{sinal.nome_usuario}</p>
              <p className="text-gray-500">{sinal.funcao_usuario}</p>
            </div>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  )
}

export default Detalhes