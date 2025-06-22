import { saveAs } from 'file-saver';
import { AlignmentType, BorderStyle, Document, Header, HeadingLevel, ImageRun, Media, Packer, PageBreak, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, TextWrappingSide, TextWrappingType, VerticalAlign, WidthType } from 'docx';

async function generateDocx(data: any, responsaveis: any, nome: string, cpf: string, dataInicio: string, dataFim: string, nomeDoc: string) {

  const espacoEmBranco = new Paragraph({})
  const quebraDePagina = new Paragraph({ children: [new PageBreak()] })

  function textoLivre(texto: string) {
    return new Paragraph(texto)
  }

  function paragrafoInformacoes(titulo: string, texto: string) {
    return (
      new Paragraph({
        children: [
          new TextRun({ text: titulo, bold: true, }),
          new TextRun({ text: `\t${texto}`, bold: false, }),
        ],
      })
    )
  }

  function _heading1(texto: string) {
    return (
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: texto, bold: true })
        ]
      })
    )
  }

  function _heading2(texto: string) {
    return (
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: texto, bold: true })
        ]
      })
    )
  }

  function textoNormal(texto: string) {
    return new TextRun(texto)
  }

  function textoNegrito(texto: string) {
    return new TextRun({ text: texto, bold: true })
  }

  function celulaCabecalho(size: number, text: string, bold: boolean) {
    return (
      new TableCell({
        width: { size: size, type: WidthType.DXA, },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: text, bold: bold, size: 16 })
            ],
            alignment: AlignmentType.CENTER,
          })],
        verticalAlign: VerticalAlign.CENTER
      })
    )
  }

  function celulaLinha(size: number, text: string, bold: boolean) {
    new TableCell({
      width: { size: size, type: WidthType.DXA, },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: text, bold: bold, size: 16 })
          ],
          alignment: AlignmentType.CENTER,
        })],
      verticalAlign: VerticalAlign.CENTER
    })
  }

  function tableHeaderObservacoes() {
    const columns = 3
    const size = 30000 / columns
    return (
      new TableRow({
        tableHeader: true,
        children: [
          celulaCabecalho(size, "Data Registro", true),
          celulaCabecalho(size, "Responsável", true),
          celulaCabecalho(size, "Anotações", true),
        ]
      })
    )
  }

  function tableRowObservacoes(data: string, responsavel: string, observacoes: string,) {

    const columns = 3
    const size = 30000 / columns
    return (
      new TableRow({
        children: [
          celulaCabecalho(size, data, false),
          celulaCabecalho(size, responsavel, false),
          celulaCabecalho(size, observacoes, false),
        ]
      })
    )
  }

  function tabelaLinhaCabecalho() {
    const columns = 16
    const size = 30000 / columns
    return (
      new TableRow({
        tableHeader: true,
        children: [
          celulaCabecalho(size, "Data Registro", true),
          celulaCabecalho(size, "Responsável", true),
          celulaCabecalho(size, "Consciência", true),
          celulaCabecalho(size, "Hemodinâmico", true),
          celulaCabecalho(size, "Cardiovascular", true),
          celulaCabecalho(size, "Pressão Arterial", true),
          celulaCabecalho(size, "Respiratório", true),
          celulaCabecalho(size, "Mucosas", true),
          celulaCabecalho(size, "Integ. Cutâneas", true),
          celulaCabecalho(size, "MMSS", true),
          celulaCabecalho(size, "MMII", true),
          celulaCabecalho(size, "Dieta", true),
          celulaCabecalho(size, "Abdômen", true),
          celulaCabecalho(size, "Eliminações", true),
          celulaCabecalho(size, "Eliminações Int.", true),
          celulaCabecalho(size, "Ausc. Pulmonar", true),
        ]
      })
    )
  }

  function tabelaLinhaComum(data: string, responsavel: string, consciencia: string, hemodinamico: string, cardiovascular: string, pressaoarterial: string, respiratorio: string,
    mucosas: string, integridadecutanea: string, mmss: string, mmii: string, aceitacaodadieta: string, abdomen: string, eliminacoes: string,
    eliminacoesintestinais: string, auscultapulmonar: string) {

    const columns = 16
    const size = 30000 / columns
    return (
      new TableRow({
        children: [
          celulaCabecalho(size, data, false),
          celulaCabecalho(size, responsavel, false),
          celulaCabecalho(size, consciencia, false),
          celulaCabecalho(size, hemodinamico, false),
          celulaCabecalho(size, cardiovascular, false),
          celulaCabecalho(size, pressaoarterial, false),
          celulaCabecalho(size, respiratorio, false),
          celulaCabecalho(size, mucosas, false),
          celulaCabecalho(size, integridadecutanea, false),
          celulaCabecalho(size, mmss, false),
          celulaCabecalho(size, mmii, false),
          celulaCabecalho(size, aceitacaodadieta, false),
          celulaCabecalho(size, abdomen, false),
          celulaCabecalho(size, eliminacoes, false),
          celulaCabecalho(size, eliminacoesintestinais, false),
          celulaCabecalho(size, auscultapulmonar, false),
        ]
      })
    )
  }

  const table = new Table({
    rows: [
      tabelaLinhaCabecalho(),
      ...data.map((item: any, index: any) => {
        const fullName = item.usuario_nome;
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        const abbreviatedName = `${firstName} ${lastName.charAt(0)}.`;

        return (
          tabelaLinhaComum(item.createdAt, abbreviatedName, item.consciencia, item.hemodinamico, item.cardiovascular,
            item.pressaoarterial, item.respiratorio, item.mucosas, item.integridadecutanea, item.mmss, item.mmii, item.aceitacaodadieta, item.abdomen,
            item.eliminacoes, item.eliminacoesintestinais, item.auscultapulmonar)
        )
      }),
    ],
  });

  const tableObservacoes = new Table({
    rows: [
      tableHeaderObservacoes(),

      ...data.map((item: any, index: any) => {
        const fullName = item.usuario_nome;
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        const abbreviatedName = `${firstName} ${lastName.charAt(0)}.`;

        return (tableRowObservacoes(item.createdAt, abbreviatedName, item.observacoes))
      }),
    ],
  });

  const table2 = new Table({
    rows: [
      new TableRow({
        children: [
          ...responsaveis.map((item: any, index: any) => {
            const maxWidth = 30000 / responsaveis.length
            return (
              new TableCell({
                width: { size: maxWidth, type: WidthType.DXA, },
                children: [new Paragraph(item)],
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
              })
            )
          })
        ]
      }),
    ]
  })

  const tableInfoRelatorio = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10000, type: WidthType.DXA, },
            children: [paragrafoInformacoes('Nome do Residente:', nome)],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          }),
          new TableCell({
            width: { size: 10000, type: WidthType.DXA, },
            children: [paragrafoInformacoes('CPF:', cpf)],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          }),
          new TableCell({
            width: { size: 10000, type: WidthType.DXA, },
            children: [paragrafoInformacoes('Data do Relatório:', `${dataInicio} à ${dataFim}`)],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          }),
        ]
      }),
    ]
  })

  const doc = new Document(
    {
      sections: [
        {
          properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },

          children: [
            _heading1("Relatório de Anotações da Enfermagem"),
            espacoEmBranco,
            tableInfoRelatorio,
            espacoEmBranco,
            table,
            espacoEmBranco,
            quebraDePagina,
            _heading2("Assinaturas"),
            table2,
          ],

        },
      ],
    });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${nomeDoc}.docx`);
  });
}

export default generateDocx;