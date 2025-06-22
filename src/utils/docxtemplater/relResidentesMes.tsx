import React from "react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

let PizZipUtils: any = null;
var mainZip = new PizZip();

interface objAnotacoes {
  "_id": string;
  "residente_id": string;
  "usuario_id": string;
  "usuario_nome": string;
  "createdAt": string;
  "updatedAt": string;
  "data": string;
  "consciencia": string;
  "hemodinamico": string;
  "cardiovascular": string;
  "pressaoarterial": string;
  "respiratorio": string;
  "mucosas": string;
  "integridadecutanea": string;
  "mmss": string;
  "mmii": string;
  "aceitacaodadieta": string;
  "abdomen": string;
  "eliminacoes": string;
  "eliminacoesintestinais": string;
  "auscultapulmonar": string;
  "observacoes": string;
}

interface objSinais {
  createdAt: string;
  diurese: string;
  evacuacao: string;
  frequenciaCardiaca: string;
  frequenciaRespiratoria: string;
  glicemiaCapilar: string;
  pressaoArterial: string;
  residente_id: string;
  saturacao: string;
  temperatura: string;
  updatedAt: string;
  usuario_id: string;
  usuario_nome: string;
  _id: string;
}

interface objProfs {
  nome: string;
  registro: string;
  _id: string
}

interface objEvolucoes {
  dataEvolucao: string;
  area: string;
  usuario_nome: string;
  descricao: string;
}

interface GenerateDocumentProps {
  nomeResidente: string;
  cpfResidente: string;
  loopAnotacoes: objAnotacoes[];
  loopSinais: objSinais[];
  profissionais: objProfs[];
  evolucoes: objEvolucoes[];
  dataInicial: string;
  dataFinal: string;
}

if (typeof window !== "undefined") {
  import("pizzip/utils/index.js").then(function (r) {
    PizZipUtils = r;
  });
}

function loadFile(url: any): Promise<any> {
  return new Promise((resolve, reject) => {
    PizZipUtils.getBinaryContent(url, (error: any, content: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(content);
      }
    });
  });
}

function GenerateDocument({ nomeResidente, cpfResidente, loopAnotacoes, loopSinais, dataInicial, dataFinal, profissionais, evolucoes }: GenerateDocumentProps): Promise<any> {
  return new Promise((resolve, reject) => {
    loadFile("/templates/t_rel_SinaisEvoAnotacoes.docx").then((content) => {
      var zip = new PizZip(content);
      var doc = new Docxtemplater().loadZip(zip);

      doc.setData(
        {
          nomeResidente,
          cpfResidente,
          anotacoes: loopAnotacoes,
          sinais: loopSinais,
          dataInicial,
          dataFinal,
          profissionais: profissionais,
          evolucoes: evolucoes
        });

      try {
        // render the document
        doc.render();
      } catch (error) {
        console.error(JSON.stringify({ error: error }));
        reject(error);
        return;
      }

      var out = doc.getZip().generate({
        type: "arraybuffer",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
      });

      resolve(out);
    });
  });
}

const RelResidentesMes = async (data: any, dataRel: string, dataFimRel: string) => {
  let [dAno, dMes, dDia] = dataRel.split('-')

  for (let index = 0; index < data.length; index++) {
    const dados = data[index];
    try {
      const doc = await GenerateDocument({
        nomeResidente: dados.residente_info.nome,
        cpfResidente: dados.residente_info.cpf,
        loopAnotacoes: dados.resultados,
        loopSinais: dados.sinais,
        dataInicial: dataRel,
        dataFinal: dataFimRel,
        profissionais: dados.profissionais,
        evolucoes: dados.evolucoes
      });

      if (doc != null) {
        let nomeSemEspaco = dados.residente_info.nome as string
        nomeSemEspaco = nomeSemEspaco.replaceAll(" ", "")
        mainZip.file(`rel_${dAno}_${dMes}_${nomeSemEspaco}.docx`, doc);
      }
    } catch (error) {
      console.error("Error generating document:", error);
    }
  }

  const outputBlob = mainZip.generate({
    type: "blob",
    compression: "DEFLATE",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  saveAs(outputBlob, `rel_${dAno}_${dMes}_anotacoes_evolucao_sinais.zip`);
};

export default RelResidentesMes;
